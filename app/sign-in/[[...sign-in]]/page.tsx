import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Access your email dashboard
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary:
                'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
              card: 'bg-transparent shadow-none',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              socialButtonsBlockButton:
                'border border-gray-300 hover:bg-gray-50 text-sm normal-case',
              formFieldInput:
                'rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500',
              footerActionLink: 'text-blue-600 hover:text-blue-700',
              footer: {
                display: 'none',
              },
            },
          }}
          routing="path"
          path="/sign-in"
          // signUpUrl="/sign-up"
          redirectUrl="/email"
        />
      </div>
    </div>
  );
}
