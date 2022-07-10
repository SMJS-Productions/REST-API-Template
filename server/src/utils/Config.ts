import { readFileSync, writeFileSync } from "fs";
import { BetterObject, DevConsole } from "std-node";

export class Config<T> {

    private readonly path: string;

    private readonly ignoredKeys: (keyof T)[];

    private readonly object: T;

    private readonly original: T;

    constructor(path: string, ...ignoredKeys: (keyof T)[]) {
        this.path = path;
        this.ignoredKeys = ignoredKeys;
        this.object = JSON.parse(readFileSync(path, "utf8"));
        this.original = Object.assign({}, this.object);
    }

    public toObject(): T {
        return this.object;
    }

    public get<K extends keyof T>(key: K): T[K] {
        return this.object[key];
    }

    public set<K extends keyof T>(key: K, value: T[K]): Config<T> {
        this.object[key] = value;

        return this;
    }

    public remove<K extends keyof T>(key: K): boolean {
        try {
            delete this.object[key];

            return true;
        } catch (error) {
            DevConsole.error(error);

            return false;
        }
    }

    public keys(): (keyof T)[] {
        return BetterObject.keys(this.object);
    }

    public values(): T[keyof T][] {
        return BetterObject.values(this.object);
    }

    public has<K extends keyof T>(key: K): boolean {
        return Array.isArray(this.object) ? this.object.includes(key) : key in this.object;
    }

    public save(): Config<T> {
        const saveObject = Object.assign(Array.isArray(this.object) ? [] : {}, this.object);

        this.ignoredKeys.forEach((key) => saveObject[key] = this.original[key]);

        writeFileSync(this.path, JSON.stringify(saveObject, null, 2));

        return this;
    }
}