import { describe, expect, it } from "vitest";
import {
  toActiveFilter,
  validateCreateUser,
  type CreateUserInput
} from "../../src/domain/userAdministration";

const validUser: CreateUserInput = {
  email: "usuario@sena.edu.co",
  first_name: "Ana",
  last_name: "Pérez",
  actor_type: "USER"
};

describe("HU-IAM-015 user validation", () => {
  it("requires document fields for an instructor and a learner", () => {
    expect(validateCreateUser({ ...validUser, actor_type: "LEARNER" })).toMatchObject({
      document_type: expect.any(String),
      document_number: expect.any(String)
    });
    expect(
      validateCreateUser({
        ...validUser,
        actor_type: "INSTRUCTOR",
        document_type: "CC",
        document_number: "12345"
      })
    ).toMatchObject({ default_max_hours_per_week: expect.any(String) });
  });

  it("accepts an instructor when all conditional fields are valid", () => {
    expect(
      validateCreateUser({
        ...validUser,
        actor_type: "INSTRUCTOR",
        document_type: "CC",
        document_number: "12345",
        default_max_hours_per_week: 20
      })
    ).toEqual({});
  });

  it("maps status filters to the confirmed API parameter", () => {
    expect(toActiveFilter("all")).toBeUndefined();
    expect(toActiveFilter("active")).toBe(true);
    expect(toActiveFilter("inactive")).toBe(false);
  });
});
