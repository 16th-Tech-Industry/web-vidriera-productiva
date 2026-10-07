export interface NewsCardProps {
  image: string;
  text: string;
}

/** Tarjeta de noticia: imagen + texto. */
export default function NewsCard({ image, text }: NewsCardProps) {
  return (
    <div className="news-card">
      <img src={image} alt="" className="news-card-image" />
      <p className="news-card-text">{text}</p>
    </div>
  );
}
