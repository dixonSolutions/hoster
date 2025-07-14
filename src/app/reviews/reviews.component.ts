import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ServiceReview, ServiceReviewSummary } from '../models/ServiceReview';
import { ReviewService } from '../services/review.service';
import { ReviewFormComponent } from '../review-form/review-form.component';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    RatingModule,
    DividerModule,
    SkeletonModule,
    MessageModule,
    BadgeModule,
    AvatarModule,
    DialogModule,
    ReviewFormComponent
  ],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.css']
})
export class ReviewsComponent implements OnInit, OnDestroy {
  @Input() serviceId!: string;
  @Input() businessId!: string;
  @Input() showAddReview: boolean = true;
  @Input() maxReviewsToShow: number = 5;
  @Input() compact: boolean = false;

  private reviewService = inject(ReviewService);
  private messageService = inject(MessageService);
  private destroy$ = new Subject<void>();

  reviews: ServiceReview[] = [];
  reviewSummary: ServiceReviewSummary | null = null;
  loading = false;
  error: string | null = null;
  showAllReviews = false;

  ngOnInit() {
    console.log('📋 ReviewsComponent ngOnInit');
    console.log('📋 ServiceId received:', this.serviceId);
    console.log('📋 BusinessId received:', this.businessId);
    
    if (this.serviceId) {
      this.loadReviews();
      this.loadReviewSummary();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadReviews() {
    this.loading = true;
    this.error = null;
    
    this.reviewService.getReviewsForService(this.serviceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reviews) => {
          this.reviews = reviews.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          this.loading = false;
        },
        error: (error) => {
          this.error = error.message || 'Failed to load reviews';
          this.loading = false;
          console.error('Error loading reviews:', error);
        }
      });
  }

  loadReviewSummary() {
    this.reviewService.getReviewSummary(this.serviceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.reviewSummary = summary;
        },
        error: (error) => {
          console.error('Error loading review summary:', error);
        }
      });
  }

  get displayedReviews(): ServiceReview[] {
    if (this.showAllReviews) {
      return this.reviews;
    }
    return this.reviews.slice(0, this.maxReviewsToShow);
  }

  get hasMoreReviews(): boolean {
    return this.reviews.length > this.maxReviewsToShow;
  }

  toggleShowAll() {
    this.showAllReviews = !this.showAllReviews;
  }

  onReviewAdded(review: ServiceReview) {
    this.reviews.unshift(review);
    this.loadReviewSummary(); // Refresh summary
    this.messageService.add({
      severity: 'success',
      summary: 'Review Added',
      detail: 'Your review has been successfully added!'
    });
  }

  onReviewUpdated(updatedReview: ServiceReview) {
    const index = this.reviews.findIndex(r => r.reviewID === updatedReview.reviewID);
    if (index !== -1) {
      this.reviews[index] = updatedReview;
      this.loadReviewSummary(); // Refresh summary
      this.messageService.add({
        severity: 'success',
        summary: 'Review Updated',
        detail: 'Your review has been successfully updated!'
      });
    }
  }

  onReviewDeleted(reviewId: string) {
    this.reviews = this.reviews.filter(r => r.reviewID !== reviewId);
    this.loadReviewSummary(); // Refresh summary
    this.messageService.add({
      severity: 'success',
      summary: 'Review Deleted',
      detail: 'Review has been successfully deleted!'
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStarArray(stars: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < stars);
  }

  getStarPercentage(star: number): number {
    if (!this.reviewSummary?.starDistribution) return 0;
    const total = this.reviewSummary.totalReviews;
    const count = this.reviewSummary.starDistribution[star] || 0;
    return total > 0 ? (count / total) * 100 : 0;
  }
} 