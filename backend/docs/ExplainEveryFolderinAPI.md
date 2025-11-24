proyecto-social/backend/
│
├── prisma/                          # Database schema and migrations
│   ├── migrations/                  # Auto-generated migration files
│   ├── schema.prisma                # Database schema definition
│   └── seed.ts                      # Database seeding script (optional)
│
├── src/                             # Source code
│   │
│   ├── config/                      # Configuration files
│   │   ├── database.ts              # Database connection singleton
│   │   └── app.ts                   # App-wide configurations
│   │
│   ├── controllers/                 # Presentation Layer - HTTP handlers
│   │   ├── CategoryController.ts    # Category endpoints handler
│   │   ├── BeneficiaryController.ts # Beneficiary endpoints handler
│   │   └── ...                      # Other entity controllers
│   │
│   ├── middleware/                  # Express middleware
│   │   ├── errorHandler.ts          # Global error handling
│   │   ├── auth.ts                  # Authentication middleware (Auth0)
│   │   ├── validation.ts            # Request validation middleware
│   │   └── logger.ts                # Request/response logging
│   │
│   ├── models/                      # Domain Layer - Business entities
│   │   ├── Category.ts              # Category domain model
│   │   ├── Beneficiary.ts           # Beneficiary domain model
│   │   └── ...                      # Other domain models
│   │
│   ├── repositories/                # Infrastructure Layer - Data access
│   │   ├── interfaces/              # Repository contracts
│   │   │   ├── ICategoryRepository.ts
│   │   │   └── ...
│   │   ├── CategoryRepository.ts    # Prisma implementation
│   │   ├── InMemoryCategoryRepository.ts  # Testing implementation
│   │   └── ...                      # Other repository implementations
│   │
│   ├── routes/                      # Route definitions
│   │   ├── index.ts                 # Main router (aggregates all routes)
│   │   ├── categoryRoutes.ts        # Category endpoints
│   │   ├── beneficiaryRoutes.ts     # Beneficiary endpoints
│   │   └── ...                      # Other route files
│   │
│   ├── services/                    # Application Layer - Business logic
│   │   ├── interfaces/              # Service contracts
│   │   │   ├── ICategoryService.ts
│   │   │   └── ...
│   │   ├── CategoryService.ts       # Category business logic
│   │   ├── CacheService.ts          # Caching abstraction
│   │   ├── RedisCacheService.ts     # Redis implementation
│   │   └── ...                      # Other services
│   │
│   ├── types/                       # TypeScript type definitions
│   │   ├── dto/                     # Data Transfer Objects
│   │   │   ├── category.dto.ts      # Category API contracts
│   │   │   ├── beneficiary.dto.ts   # Beneficiary API contracts
│   │   │   └── ...
│   │   ├── express/                 # Express type extensions
│   │   │   └── index.d.ts           # Custom Express types
│   │   └── common.types.ts          # Shared types
│   │
│   ├── utils/                       # Utility functions
│   │   ├── errors.ts                # Custom error classes
│   │   ├── logger.ts                # Logging utility
│   │   ├── validators.ts            # Common validators
│   │   └── helpers.ts               # Helper functions
│   │
│   └── index.ts                     # Application entry point
│
├── tests/                           # Test files
│   ├── unit/                        # Unit tests
│   │   ├── models/                  # Domain model tests
│   │   ├── services/                # Service tests
│   │   └── repositories/            # Repository tests
│   ├── integration/                 # Integration tests
│   │   ├── api/                     # API endpoint tests
│   │   └── database/                # Database tests
│   └── e2e/                         # End-to-end tests
│
├── .env                             # Environment variables (not in git)
├── .env.example                     # Environment variables template
├── .eslintrc.json                   # ESLint configuration
├── .prettierrc                      # Prettier configuration
├── docker-compose.yml               # Docker services (PostgreSQL, Redis)
├── package.json                     # Node dependencies and scripts
├── prisma.config.ts                 # Prisma CLI configuration
├── tsconfig.json                    # TypeScript configuration
└── README.md                        # Project documentation