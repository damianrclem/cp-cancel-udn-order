// @ts-nocheck

import { deactivateUDNOrder } from '../../../src/clients/creditPlus';
import { handler, InvalidParamsError } from '../../../src/functions/cancelUDNOrder';

jest.mock('../../../src/clients/creditPlus', () => ({
  deactivateUDNOrder: jest.fn()
}))

jest.mock('../../../src/common/dynamoDb', () => ({
  getItem: jest.fn()
}))

describe('cancelUDNOrder', () => {
  test('Throws an InvalidParams error if loan does not exist on event', async () => {
    await expect(handler({
      detail: {}
    }, {}, () => { })).rejects.toThrow(InvalidParamsError)
  });

  test('Throws an InvalidParams error if loan id does not exist on event.loan', async () => {
    await expect(handler({
      detail: {
        loan: {}
      }
    }, {}, () => { })).rejects.toThrow(InvalidParamsError)
  });

  test('Throws an InvalidParams error if fields does not exist on event', async () => {
    await expect(handler({
      detail: {
        loan: {
            id: '123'
        }
      }
    }, {}, () => { })).rejects.toThrow(InvalidParamsError)
  });

  test('Throws an InvalidParams error if CX.CP.UDN.FILENUMBER does not exist on event.fields', async () => {
    await expect(handler({
      detail: {
        loan: {
            id: '123'
        },
        fields: {
        }
      }
    }, {}, () => { })).rejects.toThrow(InvalidParamsError)
  });

  test('Throws an InvalidParams error if 4000 does not exist on event.fields', async () => {
    await expect(handler({
      detail: {
        loan: {
            id: '123'
        },
        fields: {
            'CX.CP.UDN.FILENUMBER': '000'
        }
      }
    }, {}, () => { })).rejects.toThrow(InvalidParamsError)
  });

  test('Throws an InvalidParams error if 4002 does not exist on event.fields', async () => {
    await expect(handler({
      detail: {
        loan: {
            id: '123'
        },
        fields: {
            '4000': 'bruce'
        }
      }
    }, {}, () => { })).rejects.toThrow(InvalidParamsError)
  });

  test('Throws an InvalidParams error if 65 does not exist on event.fields', async () => {
    await expect(handler({
      detail: {
        loan: {
            id: '123'
        },
        fields: {
            '4000': 'bruce',
            '4002': 'wayne'
        }
      }
    }, {}, () => { })).rejects.toThrow(InvalidParamsError)
  });

  test('should not throw an error if borrower data exists', async () => {
    deactivateUDNOrder.mockReturnValue(new Promise((resolve, reject) => {
      resolve({
        statusCode: 200
      })
    }));

    await expect(handler({
      detail: {
        loan: {
          id: '123'
        },
        fields: {
            'CX.CP.UDN.FILENUMBER': '456',
            '4000': 'peter',
            '4002': 'parker',
            '65': '123456',
        }
      }
    }, {}, () => { })).resolves.not.toThrow()
  });

  test('should not throw an error if borrower and coborrower data exists', async () => {
    deactivateUDNOrder.mockReturnValue(new Promise((resolve, reject) => {
      resolve({
        statusCode: 200
      })
    }));

    await expect(handler({
      detail: {
        loan: {
          id: '123'
        },
        fields: {
            'CX.CP.UDN.FILENUMBER': '456',
            '4000': 'peter',
            '4002': 'parker',
            '65': '123456',
            '4004': 'mary jane',
            '4006': 'watson',
            '97': '09876'
        }
      }
    }, {}, () => { })).resolves.not.toThrow()
  });
});
