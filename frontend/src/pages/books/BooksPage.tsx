import { useQuery } from '@tanstack/react-query';
import { booksApi } from '@/api/catalog';
import { useBodyClass } from '@/hooks/useBodyClass';
import '@/styles/pages/books.page.css';
import BooksContent from './BooksContent';

/** Books gallery (books.php). */
export default function BooksPage() {
  useBodyClass('page-books');
  const { data, isLoading } = useQuery({ queryKey: ['books'], queryFn: booksApi.list });
  return <BooksContent books={data} isLoading={isLoading} />;
}
