/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { User } from './User';
export type AuthResponse = {
    success?: boolean;
    message?: string;
    /**
     * JWT token
     */
    token?: string;
    user?: User;
};

