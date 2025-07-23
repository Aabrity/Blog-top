
import { Link } from 'react-router-dom';

export default function PostCard({ post }) {
  return (
    <div className="group relative w-full max-w-sm sm:max-w-md md:max-w-[400px] h-[420px] mx-auto border border-green-500 hover:border-2 hover:border-green-600 rounded-lg overflow-hidden transition-all">
      <Link to={`/post/${post.slug}`}>
        <img
          src={`uploads/${post.images}`}
          alt="post cover"
          className="h-[260px] w-full object-cover group-hover:h-[200px] transition-all duration-300 z-10"
        />
      </Link>

      <div className="p-3 flex flex-col gap-2 h-[160px] relative">
        <p className="text-base font-semibold line-clamp-2">{post.title}</p>
        <span className="italic text-sm text-gray-600 dark:text-gray-300">
          {post.category}
        </span>
        <span className="text-sm font-medium text-gray-800 dark:text-white">
          🏴 {post.flag}
        </span>

        
        <Link
          to={`/post/${post.slug}`}
          className="absolute left-3 right-3 bottom-0 sm:group-hover:bottom-0 sm:bottom-[-200px] transition-all duration-300 bg-white/90 border border-green-600 dark:bg-gray-600 dark:hover:bg-green-800  text-green-600 hover:bg-green-800 hover:text-white text-center py-2 rounded-md !rounded-tl-none"
        >
          Read article
        </Link>
      </div>
    </div>
  );
}
