export interface ServiceReview {
  reviewID: string;
  businessID: string;
  serviceID: string;
  stars: number; // 1-5 range
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateServiceReviewRequest {
  businessID: string;
  serviceID: string;
  stars: number;
  name: string;
  description?: string;
}

export interface UpdateServiceReviewRequest {
  stars: number;
  name: string;
  description?: string;
}

export interface ServiceReviewSummary {
  serviceID: string;
  totalReviews: number;
  averageStars: number;
  starDistribution: {
    [key: number]: number; // star rating -> count
  };
}

export interface ServiceReviewResponse {
  success: boolean;
  message: string;
  data?: ServiceReview;
  errors?: string[];
}

export interface ServiceReviewListResponse {
  success: boolean;
  message: string;
  data?: ServiceReview[];
  errors?: string[];
} 