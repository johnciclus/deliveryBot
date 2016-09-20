/* @flow */

class GetProductsParams {
  businessId = 0;
  lat = 0;
  lng = 0;
  category =  '';
  pointSale =  '';

  constructor (businessId) {
    this.businessId = businessId
  }

}
export default GetProductsParams
