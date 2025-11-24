# Request/Response Flow

Let's trace a request through the entire system using POST /api/categories as an example:
┌──────────────┐
│    CLIENT    │
│  (Browser/   │
│   Postman)   │
└──────┬───────┘
       │ 1. HTTP POST /api/categories
       │    Body: { "name": "Fresh Fruits", "type": "FOOD" }
       ↓
┌──────────────────────────────────────────────────────────────┐
│                         EXPRESS APP                          │
│                        (src/index.ts)                        │
│                                                              │
│  2. Middleware Chain (Applied in Order):                    │
│     • helmet() - Security headers                           │
│     • cors() - CORS handling                                │
│     • express.json() - Parse JSON body                      │
│     • express.urlencoded() - Parse URL-encoded data         │
│     • Custom logger - Log request                           │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                      ROUTER LAYER                            │
│                  (src/routes/index.ts)                       │
│                                                              │
│  3. Route Matching:                                          │
│     • Finds matching route: POST /api/categories            │
│     • Routes to categoryRoutes                              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                   CATEGORY ROUTES                            │
│               (src/routes/categoryRoutes.ts)                 │
│                                                              │
│  4. Dependency Injection Chain:                              │
│     prisma → CategoryRepository → CategoryService →         │
│     CategoryController                                       │
│                                                              │
│  5. Middleware (if any):                                     │
│     • authenticate() - Verify Auth0 token (if protected)    │
│     • authorize() - Check permissions                       │
│     • validateRequest() - Additional validation             │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                    CONTROLLER LAYER                          │
│            (src/controllers/CategoryController.ts)           │
│                                                              │
│  6. Request Handling:                                        │
│     • Extract request data (req.body)                       │
│     • Validate with Zod schema (createCategorySchema)       │
│     • If validation fails → throw ValidationError           │
│     • If validation succeeds → call service                 │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                            │
│             (src/services/CategoryService.ts)                │
│                                                              │
│  7. Business Logic:                                          │
│     • Check if name exists (repository.existsByName())      │
│     • If exists → throw ConflictError                       │
│     • Create category (repository.create())                 │
│     • Invalidate list caches                                │
│     • Return domain model                                   │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                  REPOSITORY LAYER                            │
│           (src/repositories/CategoryRepository.ts)           │
│                                                              │
│  8. Data Access:                                             │
│     • Execute Prisma query (prisma.category.create())       │
│     • Convert Prisma result to Domain Model                 │
│     • Return Category instance                              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                      DATABASE                                │
│                 (PostgreSQL + Prisma)                        │
│                                                              │
│  9. Database Operation:                                      │
│     • INSERT INTO categories (id, name, type, ...)          │
│     • Return inserted row                                   │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│              RETURN PATH (Success Case)                      │
│                                                              │
│  10. Repository → Service → Controller:                      │
│      • Repository: Returns Category domain model            │
│      • Service: Returns same Category model                 │
│      • Controller: Calls category.toJSON()                  │
│      • Controller: Wraps in response format:                │
│        {                                                     │
│          "success": true,                                    │
│          "data": { id, name, type, createdAt, updatedAt },  │
│          "message": "Category created successfully"         │
│        }                                                     │
│      • Sets status code: 201 Created                        │
│      • Sends response: res.status(201).json(...)            │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│              RETURN PATH (Error Case)                        │
│                                                              │
│  11. Error Handling:                                         │
│      • Any layer throws error → Caught by controller        │
│      • Controller passes to next(error)                     │
│      • Error middleware (errorHandler.ts) receives it       │
│      • Maps error to HTTP status:                           │
│        - ValidationError → 400 Bad Request                  │
│        - ConflictError → 409 Conflict                       │
│        - NotFoundError → 404 Not Found                      │
│        - UnauthorizedError → 401 Unauthorized               │
│        - InternalError → 500 Internal Server Error          │
│      • Returns error response:                              │
│        {                                                     │
│          "success": false,                                   │
│          "error": "Error message",                          │
│          "statusCode": 409,                                 │
│          "details": [ ... ]  // if available                │
│        }                                                     │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
                ┌──────────────┐
                │    CLIENT    │
                │  (Receives   │
                │   Response)  │
                └──────────────┘
