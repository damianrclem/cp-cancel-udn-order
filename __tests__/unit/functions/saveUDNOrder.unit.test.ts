// @ts-nocheck
import { handler, InvalidParamsError } from '../../../src/functions/saveUDNOrder';

jest.mock('../../../src/common/dynamoDb', () => ({
    putItem: jest.fn()
}))

describe('saveUDNOrder', () => {
    test('Throws an InvalidParams error if all params are not on the event detail', async () => {
        await expect(handler({
            detail: {}
        }, {}, () => { })).rejects.toThrow(InvalidParamsError)
    });

    test('should not throw an exception', async () => {
        await expect(handler({
            detail: {
                requestPayload: {
                    detail: {
                        loan: {
                            id: "123"
                        }
                    }
                },
                responsePayload: {
                    vendorOrderIdentifier: "456",
                    borrowerFirstName: "Bert",
                    borrowerLastName: "Bert",
                    borrowerSsn: "123456789",
                }
            }
        }, {}, () => { })).resolves.not.toThrow();
    });
});
