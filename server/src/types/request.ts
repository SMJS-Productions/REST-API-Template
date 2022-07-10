import { RequestHandler } from "express";

export type request = Parameters<RequestHandler>[0];