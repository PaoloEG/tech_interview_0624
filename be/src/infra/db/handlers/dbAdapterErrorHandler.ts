import { PrismaClientInitializationError, PrismaClientKnownRequestError, PrismaClientUnknownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/library"
import { InternalError } from "@domain/errors/internalError"
import { UnknownError } from "@domain/errors/unknownError"
import { ValidationError } from "@domain/errors/validationError"
import { Err } from "oxide.ts"

export class DbAdapterErrorHandler {
	static handleError(error: unknown): Err<Error> {
		if (error instanceof PrismaClientInitializationError) {
			console.error(error.message)
			return Err(new InternalError())
		}
		if (error instanceof PrismaClientKnownRequestError) {
			console.error(error.message)
			return Err(new InternalError())
		}
		if (error instanceof PrismaClientUnknownRequestError) {
			console.error(error.message)
			return Err(new InternalError())
		}
		if (error instanceof PrismaClientValidationError) {
			console.error(error.message)
			return Err(new ValidationError())
		}
		console.error(error)
		return Err(new UnknownError())
	}
}
