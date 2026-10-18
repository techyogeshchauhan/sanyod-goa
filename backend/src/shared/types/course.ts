/** Public course card/detail data (money in paise). */
export interface CourseSummary {
  id: string;
  legacyId: number | null;
  slug: string;
  title: string;
  description: string;
  image: string;
  price: number;
  discountPercent: number;
  /** floor(price / (1 - discount/100)), as shown struck-through on the live site. */
  originalPrice: number;
  videoCount: number;
  level: string;
  hasCertificate: boolean;
}

export interface HomeCourses {
  newArrivals: CourseSummary[];
  popular: CourseSummary[];
}
