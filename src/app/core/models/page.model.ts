/** Mirrors the shape of a Spring Data Page<T> JSON response. */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page index, 0-based
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}
