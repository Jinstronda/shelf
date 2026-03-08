'use client'

interface BookCardProps {
  isbn: string
  title: string
  author: string
  rating: string
  cv: string
}

export function BookCard({ isbn, title, author, rating, cv }: BookCardProps) {
  const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`

  return (
    <a href={`/book/${isbn}`} className={`card ${cv}`} style={{ textDecoration: 'none' }}>
      <img
        src={coverUrl}
        alt={title}
        width={150} height={225}
        loading="lazy" decoding="async"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
      <div className="card-hover">
        <span className="card-rating">{rating}</span>
      </div>
    </a>
  )
}
