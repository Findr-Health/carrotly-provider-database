# Provider Onboarding Platform - Technical Implementation Guide

## 🏗️ PROJECT SETUP

### Repository Structure

```
carrotly-provider-portal/
├── frontend/                 # React TypeScript app
│   ├── public/
│   ├── src/
│   │   ├── assets/          # Images, fonts, icons
│   │   ├── components/      # Reusable components
│   │   │   ├── common/      # Buttons, inputs, cards, etc.
│   │   │   ├── forms/       # Form components
│   │   │   ├── layout/      # Layout components
│   │   │   └── features/    # Feature-specific components
│   │   ├── pages/           # Page components
│   │   │   ├── auth/        # Login, register, reset
│   │   │   ├── onboarding/  # Onboarding wizard steps
│   │   │   ├── dashboard/   # Main dashboard
│   │   │   ├── profile/     # Profile editing
│   │   │   ├── services/    # Service management
│   │   │   ├── analytics/   # Analytics dashboard
│   │   │   └── reviews/     # Review management
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # Redux store setup
│   │   │   ├── slices/      # Redux slices
│   │   │   └── api/         # RTK Query API definitions
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript type definitions
│   │   ├── config/          # App configuration
│   │   ├── styles/          # Global styles, Tailwind config
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/                  # Node.js Express API
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   │   ├── auth.controller.ts
│   │   │   ├── provider.controller.ts
│   │   │   ├── service.controller.ts
│   │   │   ├── review.controller.ts
│   │   │   └── analytics.controller.ts
│   │   ├── middleware/      # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── rateLimiter.middleware.ts
│   │   ├── models/          # Database models (Prisma)
│   │   ├── routes/          # API routes
│   │   │   ├── auth.routes.ts
│   │   │   ├── provider.routes.ts
│   │   │   ├── service.routes.ts
│   │   │   └── analytics.routes.ts
│   │   ├── services/        # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── provider.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── upload.service.ts
│   │   │   └── analytics.service.ts
│   │   ├── utils/           # Utility functions
│   │   │   ├── jwt.util.ts
│   │   │   ├── crypto.util.ts
│   │   │   └── validation.util.ts
│   │   ├── types/           # TypeScript types
│   │   ├── db/              # Database utilities
│   │   │   ├── client.ts    # Prisma client
│   │   │   └── migrations/  # Database migrations
│   │   ├── app.ts           # Express app setup
│   │   └── server.ts        # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Seed data
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── shared/                   # Shared code (types, validation)
│   ├── types/               # Shared TypeScript types
│   └── validation/          # Shared validation schemas
│
├── infrastructure/           # Infrastructure as Code
│   ├── terraform/           # Terraform configs
│   ├── kubernetes/          # K8s manifests
│   └── docker/              # Docker configs
│
├── docs/                     # Documentation
│   ├── api/                 # API documentation
│   ├── architecture/        # Architecture diagrams
│   └── guides/              # User guides
│
├── .github/
│   └── workflows/           # GitHub Actions CI/CD
│       ├── test.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
│
├── docker-compose.yml        # Local development
├── .gitignore
└── README.md
```

---

## 🎨 FRONTEND IMPLEMENTATION

### 1. Initial Setup

**Install Dependencies:**
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install

# Core dependencies
npm install react-router-dom redux @reduxjs/toolkit react-redux
npm install @tanstack/react-query axios
npm install react-hook-form zod @hookform/resolvers
npm install tailwindcss postcss autoprefixer
npm install lucide-react clsx tailwind-merge

# UI components
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-tabs
npm install @radix-ui/react-toast

# File upload
npm install react-dropzone

# Date/time
npm install date-fns

# Charts
npm install recharts

# Dev dependencies
npm install -D @types/node @types/react @types/react-dom
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D prettier eslint-config-prettier
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### 2. Tailwind Setup

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff5f0',
          100: '#ffe8de',
          200: '#ffd4bd',
          300: '#ffb89b',
          400: '#ff9d7a',
          500: '#ff6b35', // Main brand color
          600: '#e65620',
          700: '#cc4318',
          800: '#b33310',
          900: '#992508',
        },
        secondary: {
          50: '#e6f1f9',
          100: '#cce3f3',
          200: '#99c7e7',
          300: '#66abdb',
          400: '#338fcf',
          500: '#004e89', // Main brand color
          600: '#003d6d',
          700: '#002d51',
          800: '#001f37',
          900: '#00101c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

### 3. Redux Store Setup

**src/store/store.ts:**
```typescript
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from './api/api';
import authReducer from './slices/authSlice';
import providerReducer from './slices/providerSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    provider: providerReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**src/store/slices/authSlice.ts:**
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string;
  role: 'provider' | 'practice_manager' | 'admin';
  providerIds: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
```

### 4. RTK Query API Setup

**src/store/api/api.ts:**
```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Provider', 'Service', 'Review', 'Analytics'],
  endpoints: () => ({}),
});
```

**src/store/api/providerApi.ts:**
```typescript
import { api } from './api';

export interface Provider {
  id: string;
  name: string;
  category: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  // ... other fields
}

export const providerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProvider: builder.query<Provider, string>({
      query: (id) => `/providers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Provider', id }],
    }),
    
    updateProvider: builder.mutation<Provider, Partial<Provider> & { id: string }>({
      query: ({ id, ...patch }) => ({
        url: `/providers/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Provider', id }],
    }),
    
    uploadProviderPhoto: builder.mutation<
      { url: string },
      { providerId: string; file: File; type: 'primary' | 'gallery' | 'logo' }
    >({
      query: ({ providerId, file, type }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        
        return {
          url: `/providers/${providerId}/photos`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { providerId }) => [
        { type: 'Provider', id: providerId },
      ],
    }),
  }),
});

export const {
  useGetProviderQuery,
  useUpdateProviderMutation,
  useUploadProviderPhotoMutation,
} = providerApi;
```

### 5. Onboarding Wizard Implementation

**src/pages/onboarding/OnboardingWizard.tsx:**
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressBar } from '@/components/common/ProgressBar';
import { StepPracticeInfo } from './steps/StepPracticeInfo';
import { StepLocation } from './steps/StepLocation';
import { StepPhotos } from './steps/StepPhotos';
import { StepServices } from './steps/StepServices';
import { StepHours } from './steps/StepHours';
import { StepStaff } from './steps/StepStaff';
import { StepPayment } from './steps/StepPayment';

const STEPS = [
  { id: 1, title: 'Practice Info', component: StepPracticeInfo },
  { id: 2, title: 'Location', component: StepLocation },
  { id: 3, title: 'Photos', component: StepPhotos },
  { id: 4, title: 'Services', component: StepServices },
  { id: 5, title: 'Hours', component: StepHours },
  { id: 6, title: 'Staff', component: StepStaff },
  { id: 7, title: 'Payment', component: StepPayment },
];

export const OnboardingWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = (data: any) => {
    setFormData({ ...formData, ...data });
    
    if (currentStep === STEPS.length) {
      // Submit all data
      submitOnboarding({ ...formData, ...data });
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitOnboarding = async (data: any) => {
    // API call to submit
    console.log('Submitting:', data);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <ProgressBar 
          current={currentStep} 
          total={STEPS.length} 
          progress={progress}
        />
        
        <div className="bg-white rounded-lg shadow-lg p-8 mt-6">
          <h2 className="text-2xl font-bold mb-6">
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
          </h2>
          
          <CurrentStepComponent
            data={formData}
            onNext={handleNext}
            onBack={handleBack}
          />
        </div>
      </div>
    </div>
  );
};
```

**src/pages/onboarding/steps/StepPracticeInfo.tsx:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';

const schema = z.object({
  name: z.string().min(1, 'Practice name is required'),
  practiceType: z.enum(['solo', 'group', 'hospital', 'clinic']),
  category: z.string().min(1, 'Category is required'),
  subcategories: z.array(z.string()).min(1, 'Select at least one'),
});

type FormData = z.infer<typeof schema>;

export const StepPracticeInfo = ({ data, onNext, onBack }: any) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: data,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <Input
        label="Practice Name *"
        {...register('name')}
        error={errors.name?.message}
      />

      <div>
        <label className="block text-sm font-medium mb-2">
          Practice Type *
        </label>
        <div className="space-y-2">
          {['solo', 'group', 'hospital', 'clinic'].map((type) => (
            <label key={type} className="flex items-center">
              <input
                type="radio"
                value={type}
                {...register('practiceType')}
                className="mr-2"
              />
              <span className="capitalize">{type} practice</span>
            </label>
          ))}
        </div>
        {errors.practiceType && (
          <p className="text-red-500 text-sm mt-1">
            {errors.practiceType.message}
          </p>
        )}
      </div>

      <Select
        label="Primary Category *"
        {...register('category')}
        error={errors.category?.message}
        options={[
          { value: 'primary-care', label: 'Primary Care' },
          { value: 'dental', label: 'Dental' },
          { value: 'urgent-care', label: 'Urgent Care' },
          // ... more options
        ]}
      />

      <div className="flex justify-between mt-8">
        <Button type="button" variant="outline" onClick={onBack} disabled>
          Back
        </Button>
        <Button type="submit" variant="primary">
          Save & Continue →
        </Button>
      </div>
    </form>
  );
};
```

### 6. Photo Upload Component

**src/components/features/PhotoUpload.tsx:**
```typescript
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Check } from 'lucide-react';
import { useUploadProviderPhotoMutation } from '@/store/api/providerApi';

interface PhotoUploadProps {
  providerId: string;
  type: 'primary' | 'gallery' | 'logo';
  maxFiles?: number;
  onUploadComplete?: (urls: string[]) => void;
}

export const PhotoUpload = ({
  providerId,
  type,
  maxFiles = 1,
  onUploadComplete,
}: PhotoUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  
  const [uploadPhoto] = useUploadProviderPhotoMutation();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles].slice(0, maxFiles));
  }, [maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles,
  });

  const handleUpload = async () => {
    setUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
        
        const result = await uploadPhoto({
          providerId,
          file,
          type,
        }).unwrap();
        
        uploadedUrls.push(result.url);
        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }

    setUploading(false);
    onUploadComplete?.(uploadedUrls);
  };

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors
          ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-400'}
        `}
      >
        <input {...getInputProps()} disabled={uploading} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag & drop files here, or click to select'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          JPG, PNG up to 5MB • Max {maxFiles} file{maxFiles > 1 ? 's' : ''}
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.name}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3 flex-1">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploadProgress[file.name] !== undefined && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-primary-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${uploadProgress[file.name]}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
              {uploadProgress[file.name] === 100 ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <button
                  onClick={() => removeFile(file.name)}
                  disabled={uploading}
                  className="text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-2 px-4 bg-primary-500 text-white rounded-lg
                     hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload Photos'}
        </button>
      )}
    </div>
  );
};
```

---

## 🔧 BACKEND IMPLEMENTATION

### 1. Initial Setup

**Install Dependencies:**
```bash
mkdir backend && cd backend
npm init -y
npm install express cors helmet compression
npm install prisma @prisma/client
npm install jsonwebtoken bcrypt
npm install express-validator
npm install multer sharp
npm install nodemailer
npm install redis ioredis
npm install dotenv

# TypeScript & dev dependencies
npm install -D typescript @types/node @types/express
npm install -D @types/cors @types/bcrypt @types/jsonwebtoken
npm install -D ts-node-dev nodemon
npm install -D jest @types/jest ts-jest supertest @types/supertest
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### 2. Prisma Setup

**prisma/schema.prisma:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                  String    @id @default(uuid())
  email               String    @unique
  passwordHash        String
  role                Role      @default(PROVIDER)
  status              UserStatus @default(PENDING_VERIFICATION)
  emailVerified       Boolean   @default(false)
  mfaEnabled          Boolean   @default(false)
  mfaSecret           String?
  verificationToken   String?
  verificationExpires DateTime?
  resetToken          String?
  resetExpires        DateTime?
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  lastLogin           DateTime?
  
  providers           Provider[]
  reviews             Review[]
  
  @@index([email])
  @@index([status])
}

enum Role {
  PROVIDER
  PRACTICE_MANAGER
  ADMIN
  SUPPORT
}

enum UserStatus {
  PENDING_VERIFICATION
  ACTIVE
  SUSPENDED
  INACTIVE
}

model Provider {
  id                      String    @id @default(uuid())
  userId                  String
  user                    User      @relation(fields: [userId], references: [id])
  
  // Basic Info
  name                    String
  legalName               String?
  slug                    String    @unique
  providerType            String?
  category                String
  subcategories           Json?
  
  // Contact
  email                   String?
  phone                   String?
  phoneAppointment        String?
  phoneAfterHours         String?
  fax                     String?
  website                 String?
  socialMedia             Json?
  
  // Location
  addressStreet           String
  addressSuite            String?
  addressCity             String
  addressState            String
  addressZip              String
  addressCountry          String    @default("US")
  latitude                Float?
  longitude               Float?
  directions              String?
  landmarks               String?
  
  // Media
  primaryPhotoUrl         String?
  logoUrl                 String?
  galleryPhotos           Json?
  
  // Status
  status                  ProviderStatus @default(PENDING_APPROVAL)
  approvalStatus          String    @default("pending")
  approvedBy              String?
  approvedAt              DateTime?
  
  // Settings
  acceptsNewPatients      Boolean   @default(true)
  acceptsWalkIns          Boolean   @default(false)
  acceptsSameDay          Boolean   @default(true)
  offersTelehealth        Boolean   @default(false)
  
  // Metadata
  profileCompletionPct    Int       @default(0)
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
  publishedAt             DateTime?
  
  // Stats
  totalViews              Int       @default(0)
  totalBookings           Int       @default(0)
  averageRating           Float     @default(0)
  reviewCount             Int       @default(0)
  
  // Relations
  services                Service[]
  hours                   ProviderHours[]
  staff                   ProviderStaff[]
  insurancePlans          InsurancePlan[]
  reviews                 Review[]
  analyticsEvents         AnalyticsEvent[]
  
  @@index([slug])
  @@index([category])
  @@index([status])
  @@index([addressCity, addressState, addressZip])
}

enum ProviderStatus {
  PENDING_APPROVAL
  ACTIVE
  SUSPENDED
  INACTIVE
}

model Service {
  id                      String    @id @default(uuid())
  providerId              String
  provider                Provider  @relation(fields: [providerId], references: [id], onDelete: Cascade)
  
  name                    String
  slug                    String
  category                String?
  description             String?
  details                 Json?
  
  // Duration
  durationMin             Int?
  durationMax             Int?
  durationFixed           Boolean   @default(true)
  
  // Pricing
  cashPrice               Float?
  cashPriceMin            Float?
  cashPriceMax            Float?
  insuranceCovered        Boolean?
  insuranceCopayMin       Float?
  insuranceCopayMax       Float?
  insuranceNote           String?
  
  // Requirements
  referralRequired        Boolean   @default(false)
  authRequired            Boolean   @default(false)
  fastingRequired         Boolean   @default(false)
  prepInstructions        String?
  
  // Age restrictions
  ageMin                  Int?
  ageMax                  Int?
  ageNote                 String?
  
  // Appointment types
  availableInPerson       Boolean   @default(true)
  availableTelehealth     Boolean   @default(false)
  
  // Availability
  sameDayAvailable        Boolean   @default(false)
  averageWaitDays         Int?
  
  // Status
  isActive                Boolean   @default(true)
  isFeatured              Boolean   @default(false)
  isPopular               Boolean   @default(false)
  
  // Stats
  bookingCount            Int       @default(0)
  viewCount               Int       @default(0)
  
  tags                    String[]
  
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
  
  @@unique([providerId, slug])
  @@index([providerId])
  @@index([category])
}

model ProviderHours {
  id          String    @id @default(uuid())
  providerId  String
  provider    Provider  @relation(fields: [providerId], references: [id], onDelete: Cascade)
  
  dayOfWeek   Int       // 0=Sunday, 1=Monday, etc.
  isClosed    Boolean   @default(false)
  openTime    String?   // "09:00"
  closeTime   String?   // "17:00"
  
  breakStart  String?
  breakEnd    String?
  
  @@unique([providerId, dayOfWeek])
}

model ProviderStaff {
  id                    String    @id @default(uuid())
  providerId            String
  provider              Provider  @relation(fields: [providerId], references: [id], onDelete: Cascade)
  
  fullName              String
  credentials           String?
  title                 String?
  photoUrl              String?
  
  specialties           String[]
  clinicalInterests     String[]
  
  bio                   String?
  
  education             Json?
  training              Json?
  boardCertifications   Json?
  licenses              Json?
  
  languages             String[]
  
  yearsExperience       Int?
  
  acceptsNewPatients    Boolean   @default(true)
  
  averageRating         Float?
  reviewCount           Int       @default(0)
  
  isActive              Boolean   @default(true)
  displayOrder          Int       @default(0)
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  reviews               Review[]
  
  @@index([providerId])
}

model InsurancePlan {
  id              String    @id @default(uuid())
  providerId      String
  provider        Provider  @relation(fields: [providerId], references: [id], onDelete: Cascade)
  
  insuranceName   String
  planTypes       String[]
  inNetwork       Boolean   @default(true)
  notes           String?
  
  createdAt       DateTime  @default(now())
  
  @@index([providerId])
  @@index([insuranceName])
}

model Review {
  id              String    @id @default(uuid())
  providerId      String
  provider        Provider  @relation(fields: [providerId], references: [id], onDelete: Cascade)
  
  staffId         String?
  staff           ProviderStaff? @relation(fields: [staffId], references: [id], onDelete: SetNull)
  
  userId          String?
  user            User?     @relation(fields: [userId], references: [id])
  
  rating          Int       // 1-5
  title           String?
  text            String?
  
  isVerified      Boolean   @default(false)
  bookingId       String?
  
  response        String?
  respondedBy     String?
  respondedAt     DateTime?
  
  status          ReviewStatus @default(PUBLISHED)
  flaggedReason   String?
  flaggedBy       String?
  flaggedAt       DateTime?
  
  helpfulCount    Int       @default(0)
  notHelpfulCount Int       @default(0)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([providerId])
  @@index([status])
  @@index([rating])
}

enum ReviewStatus {
  PENDING
  PUBLISHED
  FLAGGED
  HIDDEN
}

model AnalyticsEvent {
  id          String    @id @default(uuid())
  providerId  String
  provider    Provider  @relation(fields: [providerId], references: [id], onDelete: Cascade)
  
  eventType   String    // 'profile_view', 'service_view', etc.
  eventData   Json?
  
  userId      String?
  sessionId   String?
  ipAddress   String?
  userAgent   String?
  referrer    String?
  
  createdAt   DateTime  @default(now())
  
  @@index([providerId])
  @@index([eventType])
  @@index([createdAt])
}
```

**Initialize Prisma:**
```bash
npx prisma init
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Authentication Controller

**src/controllers/auth.controller.ts:**
```typescript
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/client';
import { sendVerificationEmail } from '../services/email.service';
import crypto from 'crypto';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, role } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: role || 'PROVIDER',
        verificationToken,
        verificationExpires,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        providers: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email verified
    if (!user.emailVerified) {
      return res.status(403).json({ error: 'Please verify your email first' });
    }

    // Check if account active
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        providerIds: user.providers.map((p) => p.id),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        status: 'ACTIVE',
        verificationToken: null,
        verificationExpires: null,
      },
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};
```

### 4. Provider Controller

**src/controllers/provider.controller.ts:**
```typescript
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import slugify from 'slugify';

export const createProvider = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const data = req.body;

    // Generate slug
    const slug = slugify(data.name, { lower: true, strict: true });

    const provider = await prisma.provider.create({
      data: {
        ...data,
        slug,
        userId,
      },
    });

    res.status(201).json(provider);
  } catch (error) {
    next(error);
  }
};

export const getProvider = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        services: true,
        hours: true,
        staff: true,
        insurancePlans: true,
      },
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json(provider);
  } catch (error) {
    next(error);
  }
};

export const updateProvider = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Check ownership
    const provider = await prisma.provider.findUnique({
      where: { id },
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    if (provider.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.provider.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
```

---

## 🚀 DEPLOYMENT

### Docker Setup

**Dockerfile (Backend):**
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001

CMD ["npm", "start"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: carrotly
      POSTGRES_PASSWORD: password
      POSTGRES_DB: carrotly_providers
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

  backend:
    build: ./backend
    ports:
      - '3001:3001'
    environment:
      DATABASE_URL: postgresql://carrotly:password@postgres:5432/carrotly_providers
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-secret-key
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - '3000:3000'
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

This implementation guide provides the foundation for building the Provider Onboarding Platform. The actual implementation would require additional files, tests, and configurations, but this gives a solid starting point with best practices and scalable architecture.