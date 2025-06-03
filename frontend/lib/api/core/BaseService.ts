import { ApiRequest } from "./ApiRequest";

/**
 * Lớp cơ sở cho tất cả các Service
 * Kế thừa từ ApiRequest để sử dụng các phương thức HTTP
 */
export class BaseService extends ApiRequest {
  constructor() {
    super();
  }
}
