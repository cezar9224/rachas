export function calculateCurrentRating(initialRating: number | null, ratings: number[]) {
  if (ratings.length === 0) return initialRating;

  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  return Math.round(average * 10) / 10;
}
