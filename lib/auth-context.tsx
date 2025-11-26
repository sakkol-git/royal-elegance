"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "./supabase-config"
import type { Session } from "@supabase/supabase-js"
import {
  type User,
  type SignInData,
  type SignUpData,
  getCurrentUser,
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  signInWithGoogle as authSignInWithGoogle,
  signInWithPhone as authSignInWithPhone,
  verifyPhoneOtp as authVerifyPhoneOtp,
  requestPasswordReset as authRequestPasswordReset,
  updatePassword as authUpdatePassword,
  updateProfile as authUpdateProfile,
  resendEmailVerification as authResendEmailVerification,
} from "./supabase-auth"
import { clearAuthStorage, validateSession, handleAuthError } from "./auth-recovery"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (data: SignInData) => Promise<void>
  signUp: (data: SignUpData) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithPhone: (phone: string) => Promise<void>
  verifyPhoneOtp: (phone: string, token: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>
  updateProfile: (data: { fullName?: string; phone?: string; avatarUrl?: string }) => Promise<void>
  resendEmailVerification: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        if (!supabase) {
          setLoading(false)
          return
        }

        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        // Handle invalid refresh token error gracefully
        if (error) {
          const isRefreshTokenError = error.message?.includes('refresh') || 
                                      error.message?.includes('Refresh Token Not Found') ||
                                      error.message?.includes('Invalid Refresh Token')
          
          if (isRefreshTokenError) {
            console.warn("Invalid refresh token detected, clearing session silently")
            // Clear storage without redirecting - user just needs to log in again
            await clearAuthStorage()
            setSession(null)
            setUser(null)
            setLoading(false)
            return
          }
          
          // Other errors
          console.warn("Session error:", error.message)
          await clearAuthStorage()
          setSession(null)
          setUser(null)
          setLoading(false)
          return
        }

        // If no session, that's okay - user just isn't logged in
        if (!initialSession) {
          setSession(null)
          setUser(null)
          setLoading(false)
          return
        }

        // Valid session exists
        setSession(initialSession)

        if (initialSession?.user) {
          const currentUser = await getCurrentUser()
          setUser(currentUser)
        }
      } catch (error: any) {
        console.error("Error initializing auth:", error)
        // Clear session on any error but don't redirect
        await clearAuthStorage()
        setSession(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    if (supabase) {
  const { data } = supabase.auth.onAuthStateChange(async (event: string, newSession: any) => {
        console.log("=== AUTH STATE CHANGE ===")
        console.log("Event:", event)
        console.log("Session:", newSession ? "present" : "null")
        console.log("User:", newSession?.user?.email || "none")
        
        // Handle token refresh errors gracefully
        if (event === 'TOKEN_REFRESHED' && !newSession) {
          console.warn("Token refresh failed, clearing session silently")
          await clearAuthStorage()
          setSession(null)
          setUser(null)
          return
        }

        // Handle signed out event
        if (event === 'SIGNED_OUT') {
          console.log("User signed out, clearing session")
          await clearAuthStorage()
          setSession(null)
          setUser(null)
          return
        }

        // Handle session update
        setSession(newSession)

        if (newSession?.user) {
          const currentUser = await getCurrentUser()
          setUser(currentUser)
        } else {
          setUser(null)
        }
        
        console.log("=== AUTH STATE CHANGE COMPLETE ===")
      })

      const subscription = (data as any)?.subscription ?? data
      return () => {
        subscription?.unsubscribe?.()
      }
    }
  }, [])

  const signIn = async (data: SignInData) => {
    try {
      const { user: newUser, session: newSession, error } = await authSignIn(data)
      if (error) {
        await handleAuthError(error, false)
        throw error
      }
      setUser(newUser)
      setSession(newSession)
    } catch (error) {
      await handleAuthError(error as any, false)
      throw error
    }
  }

  const signUp = async (data: SignUpData) => {
    try {
      const { user: newUser, session: newSession, error } = await authSignUp(data)
      if (error) {
        await handleAuthError(error, false)
        throw error
      }
      setUser(newUser)
      setSession(newSession)
    } catch (error) {
      await handleAuthError(error as any, false)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await authSignOut()
      if (error) throw error
      await clearAuthStorage()
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error("Sign out error:", error)
      // Force clear even on error
      await clearAuthStorage()
      setUser(null)
      setSession(null)
    }
  }

  const signInWithGoogle = async () => {
    const { error } = await authSignInWithGoogle()
    if (error) throw error
  }

  const signInWithPhone = async (phone: string) => {
    const { error } = await authSignInWithPhone(phone)
    if (error) throw error
  }

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const { user: newUser, session: newSession, error } = await authVerifyPhoneOtp(phone, token)
    if (error) throw error
    setUser(newUser)
    setSession(newSession)
  }

  const requestPasswordReset = async (email: string) => {
    const { error } = await authRequestPasswordReset({ email })
    if (error) throw error
  }

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    const { error } = await authUpdatePassword({ currentPassword, newPassword })
    if (error) throw error
  }

  const updateProfile = async (data: { fullName?: string; phone?: string; avatarUrl?: string }) => {
    const { error } = await authUpdateProfile(data)
    if (error) throw error
    // Refresh user data
    const currentUser = await getCurrentUser()
    setUser(currentUser)
  }

  const resendEmailVerification = async () => {
    const { error } = await authResendEmailVerification()
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        signInWithPhone,
        verifyPhoneOtp,
        requestPasswordReset,
        updatePassword,
        updateProfile,
        resendEmailVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
