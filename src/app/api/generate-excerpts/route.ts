import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userBooks, books } from '@/lib/schema'
import { eq, and, isNotNull, isNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const ALLOWED_EMAIL = 'joaopanizzutti@gmail.com'
const BATCH_SIZE = 10

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const maxDuration = 300

export async function POST() {
  const session = await auth()
  if (!session?.user?.email || session.user.email !== ALLOWED_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const rows = await db
    .select({
      id: userBooks.id,
      review: userBooks.review,
      title: books.title,
    })
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(and(
      eq(userBooks.userId, session.user.id!),
      isNotNull(userBooks.review),
      isNull(userBooks.shareExcerpt),
    ))

  const withReviews = rows.filter(r => r.review && r.review.trim().length > 20)

  let generated = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < withReviews.length; i += BATCH_SIZE) {
    const batch = withReviews.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map(async (row) => {
        const res = await openai.chat.completions.create({
          model: 'gpt-4.1-nano',
          messages: [{
            role: 'system',
            content: 'Extract the single best VERBATIM quote from this book review for a share card. Rules: 1) MUST be copied word-for-word from the review, zero paraphrasing. 2) MUST be under 140 characters total. 3) Pick the most impactful, quotable line. 4) If the review is under 140 chars, return it as-is. 5) Output ONLY the quote, nothing else. No quotation marks around it.',
          }, {
            role: 'user',
            content: `Book: "${row.title}"\n\nFull review:\n${row.review}`,
          }],
        })
        const excerpt = res.choices[0]?.message?.content?.trim()
        if (!excerpt) return null

        await db.update(userBooks)
          .set({ shareExcerpt: excerpt })
          .where(eq(userBooks.id, row.id))

        return excerpt
      })
    )

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) generated++
      else if (r.status === 'fulfilled') skipped++
      else failed++
    }
  }

  return NextResponse.json({
    total: withReviews.length,
    generated,
    skipped,
    failed,
  })
}
