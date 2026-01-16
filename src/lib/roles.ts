// lib/roles.ts
export enum Role {
    ADMIN = "ADMIN",
    MODERTOR = "MODERTOR",
    DEVELOPER = "DEVELOPER",
    USER = "USER",
}

export const hasRole = (roles: Role[] = [], role: Role) =>
    roles.includes(role)

export const hasAnyRole = (roles: Role[] = [], required: Role[]) =>
    required.some(r => roles.includes(r))
