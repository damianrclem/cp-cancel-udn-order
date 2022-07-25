import get from 'lodash/get';
import { LoggerError } from '@revolutionmortgage/rm-logger';
import axios, { AxiosResponse } from 'axios';

export class CreditPlustClient_EnvironmentConfigurationError extends LoggerError {
  constructor(message: string, data?: any) {
    super(message, data);
  }
}

/**
 * Gets credentials for credit plus API
 * @returns {string}
 */
const getCredentials = (): string => {
  const username = get(process, 'env.CREDIT_PLUS_API_USERNAME');
  if (!username) {
    throw new CreditPlustClient_EnvironmentConfigurationError('Environment variable missing CREDIT_PLUS_API_USERNAME');
  }

  const password = get(process, 'env.CREDIT_PLUS_API_PASSWORD');
  if (!password) {
    throw new CreditPlustClient_EnvironmentConfigurationError('Environment variable missing CREDIT_PLUS_API_PASSWORD');
  }

  return Buffer.from(`${username}:${password}`).toString('base64');
}

export interface DeactivateUDNOrderParams {
  orderId: string
  firstName: string
  lastName: string
  socialSecurityNumber: string
}

const createRequestHeaders = (credentials: string): {
  [key: string]: string
} => {
  const apiKey = get(process, 'env.CREDIT_PLUS_PROXY_API_KEY');
  if (!apiKey) {
      throw new CreditPlustClient_EnvironmentConfigurationError('Environment variable missing CREDIT_PLUS_PROXY_API_KEY')
  }

  const interfaceId = get(process, 'env.CREDIT_PLUS_API_INTERFACE_ID');
  if (!interfaceId) {
      throw new CreditPlustClient_EnvironmentConfigurationError('Environment variable missing CREDIT_PLUS_API_INTERFACE_ID')
  }

  const headers = {
    'Content-Type': 'text/xml',
    'Authorization': `Basic ${credentials}`,
    'x-api-key': apiKey,
    'MCL-Interface': interfaceId
  }

  if (process.env.STAGE !== 'prod') {
    headers['MCL-Interface'] = 'SmartAPITestingIdentifier'
  }

  return headers;
}

/**
 * Deactivates a UDN monitoring order
 * @param {UDNOrderParams} params
 * @returns {Promise<AxiosResponse<any>>}
 */
export const deactivateUDNOrder = async (params: DeactivateUDNOrderParams): Promise<AxiosResponse<any>> => {
  const credentials = getCredentials();
  const xmls = `<?xml version="1.0" encoding="utf-8"?>
<MESSAGE MessageType="Request" xmlns="http://www.mismo.org/residential/2009/schemas" xmlns:p2="http://www.w3.org/1999/xlink" xmlns:p3="inetapi/MISMO3_4_MCL_Extension.xsd">
	<ABOUT_VERSIONS>
		<ABOUT_VERSION>
			<DataVersionIdentifier>201703</DataVersionIdentifier>
		</ABOUT_VERSION>
	</ABOUT_VERSIONS>
	<DEAL_SETS>
		<DEAL_SET>
			<DEALS>
				<DEAL>
					<PARTIES>
						<PARTY p2:label="Party1">
							<INDIVIDUAL>
								<NAME>
									<FirstName>${params.firstName}</FirstName>
									<LastName>${params.lastName}</LastName>
								</NAME>
							</INDIVIDUAL>
							<ROLES>
								<ROLE>
									<ROLE_DETAIL>
										<PartyRoleType>Borrower</PartyRoleType>
									</ROLE_DETAIL>
								</ROLE>
							</ROLES>
							<TAXPAYER_IDENTIFIERS>
								<TAXPAYER_IDENTIFIER>
									<TaxpayerIdentifierType>SocialSecurityNumber</TaxpayerIdentifierType>
									<TaxpayerIdentifierValue>${params.socialSecurityNumber}</TaxpayerIdentifierValue>
								</TAXPAYER_IDENTIFIER>
							</TAXPAYER_IDENTIFIERS>
						</PARTY>
					</PARTIES>
					<RELATIONSHIPS>
						<RELATIONSHIP p2:arcrole="urn:fdc:Meridianlink.com:2017:mortgage/PARTY_IsVerifiedBy_SERVICE" p2:from="Party1" p2:to="Service1" />
					</RELATIONSHIPS>
					<SERVICES>
						<SERVICE p2:label="Service1">
							<CREDIT>
								<CREDIT_REQUEST>
									<CREDIT_REQUEST_DATAS>
										<CREDIT_REQUEST_DATA>
											<CREDIT_REQUEST_DATA_DETAIL>
												<CreditReportRequestActionType>Other</CreditReportRequestActionType>
												<CreditReportRequestActionTypeOtherDescription>Deactivate</CreditReportRequestActionTypeOtherDescription>
											</CREDIT_REQUEST_DATA_DETAIL>
										</CREDIT_REQUEST_DATA>
									</CREDIT_REQUEST_DATAS>
								</CREDIT_REQUEST>
							</CREDIT>
							<SERVICE_PRODUCT>
								<SERVICE_PRODUCT_REQUEST>
									<SERVICE_PRODUCT_DETAIL>
										<ServiceProductDescription>UDN</ServiceProductDescription>
									</SERVICE_PRODUCT_DETAIL>
								</SERVICE_PRODUCT_REQUEST>
							</SERVICE_PRODUCT>
							<SERVICE_PRODUCT_FULFILLMENT>
								<SERVICE_PRODUCT_FULFILLMENT_DETAIL>
									<VendorOrderIdentifier>${params.orderId}</VendorOrderIdentifier>
								</SERVICE_PRODUCT_FULFILLMENT_DETAIL>
							</SERVICE_PRODUCT_FULFILLMENT>
						</SERVICE>
					</SERVICES>
				</DEAL>
			</DEALS>
		</DEAL_SET>
	</DEAL_SETS>
</MESSAGE>`;

  const response = await axios.post(`${process.env.CREDIT_PLUS_API_ENDPOINT}`,
    xmls,
    {
      headers: createRequestHeaders(credentials)
    })
  console.log('CANCEL UDN RESPONSE');
  console.log(response.data);
  return response;
}
