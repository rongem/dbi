import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';

const requestIdHeaderName = 'x-request-id';

export const attachRequestContext = (req: Request, res: Response, next: NextFunction) => {
    const headerValue = req.header(requestIdHeaderName);
    const requestId = headerValue && headerValue.trim().length > 0 ? headerValue.trim() : randomUUID();

    req.requestId = requestId;
    res.setHeader(requestIdHeaderName, requestId);
    next();
};
