import { RequestHandler } from "express";

export type response = Parameters<RequestHandler>[1];