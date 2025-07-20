// Website Hoster Models
export interface WebsiteHostingDto {
  workspaceId: string;
  name: string;
  websiteJson?: string;
  components: Array<any>;
}

export interface BusinessRegistrationDto {
  basicInfo: BusinessBasicInfoDto;
  services: ServiceDto[];
  specificAddresses: SpecificAddressDto[];
  areaSpecifications: AreaSpecificationDto[];
  unifiedPlaces: any[];
  servicePlaceAssignments: ServicePlaceAssignmentDto[];
  staff: StaffMemberDto[];
}

export interface BusinessBasicInfoDto {
  businessID: string;
  businessName: string;
  businessDescription: string;
  phone: string;
  email: string;
  ownerEmail: string;
}

export interface ServiceDto {
  serviceID: string;
  serviceName: string;
  serviceDescription: string;
  duration: number;
  price: number;
  currency: string;
  serviceImageUrl?: string;
}

export interface SpecificAddressDto {
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  placeID: string;
}

export interface AreaSpecificationDto {
  country: string;
  state?: string;
  city?: string;
  postalCode?: string;
  placeID: string;
}

export interface StaffMemberDto {
  staffID: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: string;
  isActive: boolean;
}

export interface ServicePlaceAssignmentDto {
  businessID: string;
  serviceID: string;
  placeID: string;
  serviceType: string;
} 