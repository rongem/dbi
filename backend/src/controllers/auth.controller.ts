import { Request, Response, NextFunction } from 'express';

import { getUserAuthorization, resolveAuthenticatedUser } from '../services/auth.service.js';


export const getAuthentication = async (req: Request, res: Response, next: NextFunction) => {
    const user = await resolveAuthenticatedUser(req.ntlm);
    req.userAuthorized = user.isAuthorized;
    req.userName = user.name;
    next();
};

export const getAuthorization = async (req: Request, res: Response) => {
    const user = await getUserAuthorization(req.userName ?? 'test');
    res.json(user);
};
