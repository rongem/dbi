import { Request, Response, NextFunction } from 'express';

import { readUser } from '../models/mssql/authorization.model';
import { HttpError } from '../models/rest-api/httpError.model';
import { EnvironmentController } from './environment.controller';
import { serverError } from './error.controller';
import { User } from '../models/data/user.model';


export const getAuthentication = (req: Request, res: Response, next: NextFunction) => {
    if (EnvironmentController.instance.authMode === 'none')
    {
        req.userName='none';
        req.userAuthorized = true;
        next();
        return;
    }
    let name: string;
    if (!req.ntlm) {
        throw new HttpError(401, 'Fehlende Authentifizierung');
    }
    const domain = !req.ntlm.DomainName || req.ntlm.DomainName === '.' ? req.ntlm.Workstation : req.ntlm.DomainName;
    name = domain + '\\' + req.ntlm.UserName;
    req.userName = name;
    getUser(name).catch(async (error: Error) => {
        if (error.message !== 'Ungültige Authentifizierung') {
            throw error;
        }
        return {name: '', isAuthorized: false} as User;
    }).then((user) => {
        req.userAuthorized = user.isAuthorized;
        req.userName = user.name;
        next();
    }).catch((error: any) => serverError(next, error));
};

export const getAuthorization = (req: Request, res: Response, next: NextFunction) => {
    getUser(req.userName ?? 'test').then(user => {
        res.json(user);
    }).catch((error: HttpError) => res.status(error.httpStatusCode).json({
        error: error.message,
        data: error.data,
    }));
};

const getUser = async (name: string): Promise<User> => {
    const user = await readUser(name);
    return user;
};
