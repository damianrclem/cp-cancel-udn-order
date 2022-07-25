import { LoggerError } from "@revolutionmortgage/rm-logger";
import { EventBridgeHandler, EventBridgeEvent } from "aws-lambda";
import { AxiosResponse } from "axios";
import get from 'lodash/get';
import { deactivateUDNOrder } from "../clients/creditPlus";

interface Detail {
    event: string;
    loan: {
        id: string;
    }
    fields: {
        'CX.CP.UDN.FILENUMBER': string; // udn vendor order id
        '4000': string; // borrower first name
        '4002': string; // borrower last name
        '65': string; // borrower ssn
        '4004'?: string; // coborrower first name
        '4006'?: string; // coborrower last name
        '97'?: string; // coborrower ssn
    }
}

type EVENT_TYPE = 'Loan';
type Event = EventBridgeEvent<EVENT_TYPE, Detail>;
type Handler = EventBridgeHandler<EVENT_TYPE, Detail, void>

export class InvalidParamsError extends LoggerError {
    constructor(message: string, data?: any) {
        super(message, data);
    }
}

export class MissingItemAttributesError extends LoggerError {
    constructor(message: string, data?: any) {
        super(message, data);
    }
}

/**
 * Delete UDN Order event handler
 * @param {Event} event
 * @returns {Promise<void>}
 */
export const handler: Handler = async (event: Event): Promise<void> => {
    const detail = get(event, 'detail') as Detail;

    if (!detail.loan || 
        !detail.loan.id ||
        !detail.fields ||
        !detail.fields['CX.CP.UDN.FILENUMBER'] ||
        !detail.fields['4000'] ||
        !detail.fields['4002'] ||
        !detail.fields['65']
    ) {
        throw new InvalidParamsError('Event missing required properties', event);
    }

    const deactivateUDNOrderRequests: Array<Promise<AxiosResponse>> = [
        deactivateUDNOrder({
            firstName: detail.fields['4000'],
            lastName: detail.fields['4002'],
            orderId: detail.fields['CX.CP.UDN.FILENUMBER'],
            socialSecurityNumber: detail.fields['65']
        })
    ]

    if (detail.fields['4004'] && detail.fields['4006'] && detail.fields['97']) {
        deactivateUDNOrderRequests.push(
            deactivateUDNOrder({
                firstName: detail.fields['4004'],
                lastName: detail.fields['4006'],
                orderId: detail.fields['CX.CP.UDN.FILENUMBER'],
                socialSecurityNumber: detail.fields['97']
            })
        )
    }

    await Promise.all(deactivateUDNOrderRequests)
};