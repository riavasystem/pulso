import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, loginSchema, registerSchema } from "./model";

describe("auth schemas", () => {
  describe("loginSchema", () => {
    it("accepts valid email and password", () => {
      const result = loginSchema.safeParse({
        email: "usuario@pulso.cl",
        password: "secretpassword123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email formats", () => {
      const result = loginSchema.safeParse({
        email: "no-es-un-correo",
        password: "secretpassword123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty password", () => {
      const result = loginSchema.safeParse({
        email: "usuario@pulso.cl",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    const validData = {
      firstName: "Juan",
      lastName: "Pérez",
      email: "juan@pulso.cl",
      password: "password123",
      confirmPassword: "password123",
    };

    it("accepts valid registration data", () => {
      expect(registerSchema.safeParse(validData).success).toBe(true);
    });

    it("requires at least 6 characters for password", () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: "123",
        confirmPassword: "123",
      });
      expect(result.success).toBe(false);
    });

    it("fails when password and confirmPassword do not match", () => {
      const result = registerSchema.safeParse({
        ...validData,
        confirmPassword: "differentPassword123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Las contraseñas no coinciden",
        );
      }
    });

    it("rejects empty first or last name", () => {
      expect(
        registerSchema.safeParse({ ...validData, firstName: "" }).success,
      ).toBe(false);
      expect(
        registerSchema.safeParse({ ...validData, lastName: "" }).success,
      ).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("accepts valid email", () => {
      expect(
        forgotPasswordSchema.safeParse({ email: "recuperar@pulso.cl" }).success,
      ).toBe(true);
    });

    it("rejects invalid email", () => {
      expect(
        forgotPasswordSchema.safeParse({ email: "correo-invalido" }).success,
      ).toBe(false);
    });
  });
});

