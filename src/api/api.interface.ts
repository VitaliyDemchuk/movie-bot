export interface PayloadListDTO {
  page?: number;
}

export interface ResponseListDTO {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  content: Array<any>;
}
