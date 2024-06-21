import { fastify, FastifyInstance } from "fastify"
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox"
import { diContainer, fastifyAwilixPlugin } from "@fastify/awilix"
import { PrismaClient } from "@prisma/client"
import { asClass, asFunction, Lifetime } from "awilix"
import { fastifyRequestContext } from "@fastify/request-context"
import { createAuthRoutes } from "./routes/authRoutes"
import { authPort } from "./ports/authPort"
import { userPort } from "./ports/userPort"
import { createUsersRoutes } from "./routes/usersRoutes"
import { PgAuthPortAdapter } from "@infra/db/pgAuthPortAdapter"
import { PgUserPortAdapter } from "@infra/db/pgUserPortAdapter"
import { fastifyMultipart } from '@fastify/multipart'
import { filePort } from "./ports/filePort"
import { CloudinaryFilePortAdapter } from "@infra/cloudinary/cloudinaryFilePortAdapter"
import { v2 as cloudinary } from 'cloudinary'

export function StartServer(){
  const server: FastifyInstance = fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>()

  server.register(fastifyMultipart)
  server.register(fastifyRequestContext)
  server.register(fastifyAwilixPlugin, {
    disposeOnClose: true,
    disposeOnResponse: true,
    strictBooleanEnforced: true
  })
  
  diContainer.register({
    db: asFunction(() => new PrismaClient(), {
      lifetime: Lifetime.SINGLETON,
      dispose: async db => await db.$disconnect()
    }),
    fileClient: asFunction(() => {
      cloudinary.config({
        cloud_name: process.env["CLOUDINARY_CLOUD_NAME"], 
        api_key: process.env["CLOUDINARY_API_KEY"], 
        api_secret: process.env["CLOUDINARY_API_SECRET"]
      })
      return cloudinary
    }, {
      lifetime: Lifetime.SINGLETON,
    }),
    [authPort]: asClass(PgAuthPortAdapter, {
      lifetime: Lifetime.SINGLETON,
      dispose: module => module.dispose()
    }),
    [userPort]: asClass(PgUserPortAdapter, {
      lifetime: Lifetime.SINGLETON,
      dispose: module => module.dispose()
    }),
    [filePort]: asClass(CloudinaryFilePortAdapter, {
      lifetime: Lifetime.SINGLETON,
      dispose: module => module.dispose()
    })
  })
  
  createAuthRoutes(server)
  createUsersRoutes(server)
  
  server.listen({ port: Number(process.env["SERVER_PORT"]) || 3000 }, (err, address) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log(`Server listening at ${address}`)
  })
}
