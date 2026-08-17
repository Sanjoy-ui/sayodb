export type FieldType = "string" | "number" | "boolean" | "array" | "object" | "any";

export interface FieldConstraint {
  type: FieldType;
  required?: boolean;
}

export interface SchemaDefinition {
  name: string;
  fields: Record<string, FieldConstraint>;
  createdAt: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export class SchemaValidator {
  public static validate(schema: SchemaDefinition, payload: any): ValidationResult {
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      return { valid: false, error: "SchemaValidationError: JSON payload must be an object" };
    }

    for (const [fieldName, constraint] of Object.entries(schema.fields)) {
      const isRequired = constraint.required !== false;
      const value = payload[fieldName];

      if (value === undefined || value === null) {
        if (isRequired) {
          return {
            valid: false,
            error: `SchemaValidationError: Required field '${fieldName}' is missing`,
          };
        }
        continue;
      }

      // Type checking
      const expectedType = constraint.type;
      let actualType: string = typeof value;

      if (actualType === "object") {
        if (Array.isArray(value)) actualType = "array";
      }

      if (expectedType !== "any" && actualType !== expectedType) {
        return {
          valid: false,
          error: `SchemaValidationError: '${fieldName}' must be a ${expectedType}`,
        };
      }
    }

    return { valid: true };
  }
}

export class SchemaRegistry {
  private schemas: Map<string, SchemaDefinition> = new Map();

  public setSchema(name: string, rawDefinition: string): SchemaDefinition {
    const trimmed = name.trim().toLowerCase();
    let parsed: any;
    try {
      parsed = JSON.parse(rawDefinition);
    } catch {
      throw new Error(`Invalid JSON schema definition for '${name}'`);
    }

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error(`Schema definition for '${name}' must be a JSON object`);
    }

    const fields: Record<string, FieldConstraint> = {};

    for (const [fieldName, val] of Object.entries(parsed)) {
      if (typeof val === "string") {
        // Short format: "string", "number", etc.
        const typeStr = val.toLowerCase() as FieldType;
        fields[fieldName] = { type: typeStr, required: true };
      } else if (typeof val === "object" && val !== null) {
        // Detailed format: { type: "number", required: false }
        const obj = val as any;
        const typeStr = (obj.type || "any").toLowerCase() as FieldType;
        fields[fieldName] = {
          type: typeStr,
          required: obj.required !== false,
        };
      }
    }

    const definition: SchemaDefinition = {
      name: trimmed,
      fields,
      createdAt: Date.now(),
    };

    this.schemas.set(trimmed, definition);
    return definition;
  }

  public getSchema(name: string): SchemaDefinition | null {
    return this.schemas.get(name.trim().toLowerCase()) || null;
  }

  public deleteSchema(name: string): boolean {
    return this.schemas.delete(name.trim().toLowerCase());
  }

  public listSchemas(): string[] {
    return Array.from(this.schemas.keys());
  }

  public validatePayload(schemaName: string, rawJsonPayload: string): ValidationResult {
    const schema = this.getSchema(schemaName);
    if (!schema) {
      return {
        valid: false,
        error: `SchemaValidationError: Registered schema '${schemaName}' not found`,
      };
    }

    let payload: any;
    try {
      payload = JSON.parse(rawJsonPayload);
    } catch {
      return {
        valid: false,
        error: "SchemaValidationError: Invalid JSON syntax payload",
      };
    }

    return SchemaValidator.validate(schema, payload);
  }

  public clear(): void {
    this.schemas.clear();
  }
}

export const schemaRegistry = new SchemaRegistry();
