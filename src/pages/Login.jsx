import { useState } from "react"
import { Box, Button, Center, Container, Heading, Input, VStack, Text, Field } from "@chakra-ui/react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { useAuthStore } from "../store/useAuthStore"
import { PasswordInput } from "@/components/ui/password-input"

export default function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")

    const navigate = useNavigate()
    const setUser = useAuthStore((state) => state.setUser)

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg("")

        // 1. Panggil Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setErrorMsg(error.message)
            setLoading(false)
        } else {
            // 2. Simpan user ke Zustand & Redirect
            setUser(data.user)
            navigate("/") // Masuk ke Dashboard
        }
    }

    return (
        <Center minH="100vh" bg="bg.canvas">
            <Container maxW="sm">
                <Box
                    bg="bg.panel"
                    p={8}
                    borderRadius="xl"
                    shadow="md"
                    borderWidth="1px"
                    borderColor="border.muted"
                >
                    <VStack gap={6} align="stretch" as="form" onSubmit={handleLogin}>
                        <Box textAlign="center">
                            <Heading size="xl" color="fg" mb={2}>Agency OS</Heading>
                            <Text color="fg.muted">Masuk untuk mulai bekerja</Text>
                        </Box>

                        {/* Error Message */}
                        {errorMsg && (
                            <Box p={3} bg="red.subtle" color="red.fg" borderRadius="md" fontSize="sm">
                                {errorMsg}
                            </Box>
                        )}

                        <Field.Root>
                            <Field.Label>Email</Field.Label>
                            <Input
                                type="email"
                                placeholder="founder@agency.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </Field.Root>

                        <Field.Root>
                            <Field.Label>Password</Field.Label>
                            <PasswordInput
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </Field.Root>

                        <Button
                            type="submit"
                            colorPalette="blue"
                            size="lg"
                            loading={loading}
                            width="full"
                        >
                            Sign In
                        </Button>
                    </VStack>
                </Box>
            </Container>
        </Center>
    )
}