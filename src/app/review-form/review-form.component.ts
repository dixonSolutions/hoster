import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { 
  ServiceReview, 
  CreateServiceReviewRequest, 
  UpdateServiceReviewRequest 
} from '../models/ServiceReview';
import { ReviewService } from '../services/review.service';

// PrimeNG Imports
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    RatingModule,
    InputTextModule,
    InputTextarea,
    FloatLabelModule,
    MessageModule,
    ProgressSpinnerModule
  ],
  templateUrl: './review-form.component.html',
  styleUrls: ['./review-form.component.css']
})
export class ReviewFormComponent implements OnInit, OnDestroy {
  @Input() serviceId!: string;
  @Input() businessId!: string;
  @Input() editingReview?: ServiceReview;
  @Input() buttonLabel: string = 'Write a Review';
  @Input() buttonIcon: string = 'pi pi-star';
  @Input() buttonClass: string = 'p-button-outlined';
  @Input() showAsButton: boolean = true;
  @Input() visible: boolean = false;

  @Output() reviewAdded = new EventEmitter<ServiceReview>();
  @Output() reviewUpdated = new EventEmitter<ServiceReview>();
  @Output() reviewDeleted = new EventEmitter<string>();
  @Output() dialogClosed = new EventEmitter<void>();

  private reviewService = inject(ReviewService);
  private messageService = inject(MessageService);
  private destroy$ = new Subject<void>();

  showDialog = false;
  loading = false;
  errors: string[] = [];
  
  reviewForm = {
    name: '',
    stars: 0,
    description: ''
  };

  ngOnInit() {
    console.log('📝 ReviewFormComponent ngOnInit');
    console.log('📝 ServiceId received:', this.serviceId);
    console.log('📝 BusinessId received:', this.businessId);
    
    this.showDialog = this.visible;
    if (this.editingReview) {
      this.loadReviewForEditing();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isEditMode(): boolean {
    return !!this.editingReview;
  }

  get dialogTitle(): string {
    return this.isEditMode ? 'Edit Review' : 'Write a Review';
  }

  get submitButtonLabel(): string {
    return this.isEditMode ? 'Update Review' : 'Submit Review';
  }

  get submitButtonIcon(): string {
    return this.isEditMode ? 'pi pi-check' : 'pi pi-star';
  }

  openDialog() {
    this.resetForm();
    if (this.editingReview) {
      this.loadReviewForEditing();
    }
    this.showDialog = true;
  }

  closeDialog() {
    this.showDialog = false;
    this.resetForm();
    this.dialogClosed.emit();
  }

  loadReviewForEditing() {
    if (this.editingReview) {
      this.reviewForm = {
        name: this.editingReview.name,
        stars: this.editingReview.stars,
        description: this.editingReview.description || ''
      };
    }
  }

  resetForm() {
    this.reviewForm = {
      name: '',
      stars: 0,
      description: ''
    };
    this.errors = [];
  }

  validateForm(): boolean {
    this.errors = [];

    if (!this.reviewForm.name || this.reviewForm.name.trim().length === 0) {
      this.errors.push('Name is required');
    } else if (this.reviewForm.name.trim().length > 100) {
      this.errors.push('Name cannot exceed 100 characters');
    }

    if (!this.reviewForm.stars || this.reviewForm.stars < 1 || this.reviewForm.stars > 5) {
      this.errors.push('Please select a star rating between 1 and 5');
    }

    if (this.reviewForm.description && this.reviewForm.description.trim().length > 1000) {
      this.errors.push('Description cannot exceed 1000 characters');
    }

    if (!this.serviceId || this.serviceId.trim().length === 0) {
      this.errors.push('Service ID is required');
    }

    if (!this.businessId || this.businessId.trim().length === 0) {
      this.errors.push('Business ID is required');
    }

    return this.errors.length === 0;
  }

  async submitReview() {
    if (!this.validateForm()) {
      this.closeDialog();
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: this.errors.join(', ')
      });
      return;
    }

    this.loading = true;

    try {
      if (this.isEditMode) {
        await this.updateReview();
      } else {
        await this.addReview();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      this.closeDialog();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'Failed to submit review'
      });
    } finally {
      this.loading = false;
    }
  }

  private async addReview() {
    const reviewRequest: CreateServiceReviewRequest = {
      businessID: this.businessId,
      serviceID: this.serviceId,
      stars: this.reviewForm.stars,
      name: this.reviewForm.name.trim(),
      description: this.reviewForm.description.trim() || undefined
    };

    // Validate with service
    const validation = this.reviewService.validateReview(reviewRequest);
    if (!validation.isValid) {
      this.closeDialog();
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: validation.errors.join(', ')
      });
      return;
    }

    this.reviewService.addReview(reviewRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (review) => {
          this.reviewAdded.emit(review);
          this.closeDialog();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Review added successfully!'
          });
        },
        error: (error) => {
          this.closeDialog();
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to add review'
          });
        }
      });
  }

  private async updateReview() {
    if (!this.editingReview) return;

    const reviewRequest: UpdateServiceReviewRequest = {
      stars: this.reviewForm.stars,
      name: this.reviewForm.name.trim(),
      description: this.reviewForm.description.trim() || undefined
    };

    // Validate with service
    const validation = this.reviewService.validateReview(reviewRequest);
    if (!validation.isValid) {
      this.closeDialog();
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: validation.errors.join(', ')
      });
      return;
    }

    this.reviewService.updateReview(this.editingReview.reviewID, reviewRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (review) => {
          this.reviewUpdated.emit(review);
          this.closeDialog();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Review updated successfully!'
          });
        },
        error: (error) => {
          this.closeDialog();
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to update review'
          });
        }
      });
  }

  async deleteReview() {
    if (!this.editingReview) return;

    const confirmed = confirm('Are you sure you want to delete this review? This action cannot be undone.');
    if (!confirmed) return;

    this.loading = true;

    this.reviewService.deleteReview(this.editingReview.reviewID)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.reviewDeleted.emit(this.editingReview!.reviewID);
          this.closeDialog();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Review deleted successfully!'
          });
        },
        error: (error) => {
          this.closeDialog();
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to delete review'
          });
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  getCharacterCount(text: string): number {
    return text ? text.trim().length : 0;
  }

  getRatingLabel(rating: number): string {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Average';
      case 4: return 'Good';
      case 5: return 'Excellent';
      default: return 'Select rating';
    }
  }
} 