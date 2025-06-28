export interface BusinessRegistrationRequest {
  basicInfo: BusinessBasicInfo;
  services: ServiceRegistration[];
  specificAddresses: BusinessAddress[];
  areaSpecifications: AreaSpecification[];
  unifiedPlaces: UnifiedPlace[];
  servicePlaceAssignments: ServicePlaceAssignment[];
  staff?: StaffMember[];
}

export interface BusinessBasicInfo {
  businessName: string;
  businessDescription: string;
  phone: string;
  email: string;
  ownerEmail?: string;
  businessID?: string;
}

export interface ServiceRegistration {
  serviceID?: string;
  serviceName: string;
  serviceDescription: string;
  duration: number;
  price: number;
  currency: string;
  serviceImageUrl?: string;
  businessID?: string;
  serviceEstimatedTime?: string;
}

export interface BusinessAddress {
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface AreaSpecification {
  country: string;
  state?: string;
  city?: string;
  postalCode?: string;
}

export interface UnifiedPlace {
  placeType: 'specific' | 'area';
  streetAddress?: string;
  city?: string;
  state?: string;
  country: string;
  postalCode?: string;
  areaCountry?: string;
  areaState?: string;
  areaCity?: string;
  areaPostalCode?: string;
}

export interface ServicePlaceAssignment {
  serviceType: string;
}

export interface StaffMember {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface BusinessRegistrationResponse {
  success: boolean;
  message: string;
  businessID: string;
  serviceIDs: string[];
  placeIDs: string[];
  staffIDs: string[];
  errors?: string[];
}

export interface BusinessRegistrationFullResponse extends BusinessRegistrationRequest {
  success: boolean;
  message: string;
  businessID: string;
  serviceIDs: string[];
  placeIDs: string[];
  staffIDs: string[];
  errors?: string[];
} 