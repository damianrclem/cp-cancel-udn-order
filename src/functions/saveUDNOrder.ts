import { LoggerError } from "@revolutionmortgage/rm-logger";
import { EventBridgeHandler, EventBridgeEvent } from "aws-lambda";
import get from 'lodash/get';
import { putItem } from "../common/dynamoDb";

interface Detail {
    eventType: string
    requestPayload: {
        detail: {
            loan: {
                id: string;
            }
        }
    }
    responsePayload: {
        vendorOrderIdentifier: string;
        borrowerFirstName: string;
        borrowerLastName: string;
        borrowerSsn: string;
        coBorrowerFirstName: string;
        coBorrowerLastName: string;
        coBorrowerSsn: string;
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

/**
 * 
 * @param {Event} event - The event from AWS Event bridge
 * @param {Array<string>} pathsToRequiredParams - The paths to all required parameters expected on the event payload
 */
const validateEventPayload = (event: Event, pathsToRequiredParams: Array<string>) => {
    pathsToRequiredParams.forEach((path: string) => {
        const value = get(event, path);
        if (!value) {
            throw new InvalidParamsError(path, event);
        }
    });
}

/**
 * Save UDN Order event handler
 * @param {Event} event
 * @returns {Promise<void>}
 */
export const handler: Handler = async (event: Event) => {
    validateEventPayload(event, [
        "detail.requestPayload.detail.loan.id",
        "detail.responsePayload.borrowerFirstName",
        "detail.responsePayload.borrowerLastName",
        "detail.responsePayload.borrowerSsn",
        "detail.responsePayload.vendorOrderIdentifier"
    ])

    const loanId = get(event, "detail.requestPayload.detail.loan.id")
    const responsePayload = get(event, "detail.responsePayload");

    const key = `LOAN#${loanId}`;

    await putItem({
        PK: key,
        SK: key,
        LoanId: loanId,
        VendorOrderIdentifier: responsePayload.vendorOrderIdentifier,
        BorrowerFirstName: responsePayload.borrowerFirstName,
        BorrowerLastName: responsePayload.borrowerLastName,
        BorrowerSSN: responsePayload.borrowerSsn,
        CoborrowerFirstName: responsePayload.coBorrowerFirstName,
        CoborrowerLastName: responsePayload.coBorrowerLastName,
        CoborrowerSSN: responsePayload.coBorrowerSsn,
    })
}