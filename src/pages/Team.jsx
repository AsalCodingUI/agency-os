import { useState } from "react"
import {
    Box, Heading, Text, Button, Table, Badge, HStack, IconButton,
    Input, VStack, Spinner, Center, Field, Avatar, Flex
} from "@chakra-ui/react"
import { Plus, Trash2, Pencil, X } from "lucide-react"
import { useEmployees } from "../hooks/useEmployees"

// Helper: Format Rupiah
const formatCurrency = (val) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val)

export default function Team() {
    const { employees, isLoading, addEmployee, updateEmployee, deleteEmployee } = useEmployees()

    // State Modal
    const [isOpen, setIsOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [currentId, setCurrentId] = useState(null)

    // Form State
    const [formData, setFormData] = useState({ name: "", email: "", role: "", hourly_rate: "" })

    // -- HANDLERS --

    const handleOpenAdd = () => {
        setIsEditing(false)
        setFormData({ name: "", email: "", role: "", hourly_rate: "" }) // Reset form
        setIsOpen(true)
    }

    const handleOpenEdit = (emp) => {
        setIsEditing(true)
        setCurrentId(emp.id)
        setFormData({
            name: emp.name,
            email: emp.email || "",
            role: emp.role,
            hourly_rate: emp.hourly_rate
        })
        setIsOpen(true)
    }

    const handleSave = async () => {
        if (!formData.name || !formData.role) return // Validasi sederhana

        const payload = {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            hourly_rate: Number(formData.hourly_rate),
            status: "AVAILABLE" // Default status
        }

        try {
            if (isEditing) {
                await updateEmployee.mutateAsync({ id: currentId, ...payload })
            } else {
                await addEmployee.mutateAsync(payload)
            }
            setIsOpen(false) // Tutup modal kalau sukses
        } catch (error) {
            alert("Gagal menyimpan data: " + error.message)
        }
    }

    const handleDelete = async (id, name) => {
        if (confirm(`Yakin ingin menghapus ${name}? Data tidak bisa dikembalikan.`)) {
            await deleteEmployee.mutateAsync(id)
        }
    }

    return (
        <Box>
            {/* --- HEADER --- */}
            <Flex justify="space-between" align="center" mb={6}>
                <Box>
                    <Heading size="lg" fontWeight="bold">Team Database</Heading>
                    <Text color="gray.500" fontSize="sm">Kelola data karyawan, role, dan gaji per jam.</Text>
                </Box>
                <Button onClick={handleOpenAdd} colorPalette="blue" variant="solid">
                    <Plus size={18} /> Add Member
                </Button>
            </Flex>

            {/* --- TABLE --- */}
            <Box
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="xl"
                overflow="hidden"
                bg="white"
                shadow="sm"
            >
                {isLoading ? (
                    <Center p={10}><Spinner color="blue.500" /></Center>
                ) : (
                    <Table.Root interactive size="md">
                        <Table.Header bg="gray.50">
                            <Table.Row>
                                <Table.ColumnHeader color="gray.600">Member</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.600">Role</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.600">Status</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.600" textAlign="right">Rate / Hour</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign="right"></Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {employees.length === 0 && (
                                <Table.Row>
                                    <Table.Cell colSpan={5} textAlign="center" py={10} color="gray.400">
                                        Belum ada data karyawan.
                                    </Table.Cell>
                                </Table.Row>
                            )}

                            {employees.map((emp) => (
                                <Table.Row key={emp.id} _hover={{ bg: "gray.50" }}>
                                    <Table.Cell>
                                        <HStack gap={3}>
                                            {/* Avatar Inisial (Chakra v3) */}
                                            <Avatar.Root size="sm" name={emp.name} bg="blue.500" color="white">
                                                <Avatar.Fallback />
                                            </Avatar.Root>
                                            <Box>
                                                <Text fontWeight="semibold" fontSize="sm">{emp.name}</Text>
                                                <Text fontSize="xs" color="gray.500">{emp.email || "No Email"}</Text>
                                            </Box>
                                        </HStack>
                                    </Table.Cell>

                                    <Table.Cell>
                                        <Badge variant="surface" colorPalette="gray">{emp.role}</Badge>
                                    </Table.Cell>

                                    <Table.Cell>
                                        <Badge colorPalette={emp.status === "AVAILABLE" ? "green" : "orange"} variant="solid">
                                            {emp.status}
                                        </Badge>
                                    </Table.Cell>

                                    <Table.Cell textAlign="right" fontFamily="mono" fontSize="sm">
                                        {formatCurrency(emp.hourly_rate)}
                                    </Table.Cell>

                                    <Table.Cell textAlign="right">
                                        <HStack justify="flex-end" gap={1}>
                                            <IconButton
                                                variant="ghost"
                                                size="sm"
                                                color="gray.500"
                                                aria-label="Edit"
                                                onClick={() => handleOpenEdit(emp)}
                                            >
                                                <Pencil size={16} />
                                            </IconButton>
                                            <IconButton
                                                variant="ghost"
                                                size="sm"
                                                color="red.500"
                                                aria-label="Delete"
                                                onClick={() => handleDelete(emp.id, emp.name)}
                                            >
                                                <Trash2 size={16} />
                                            </IconButton>
                                        </HStack>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                )}
            </Box>

            {/* --- CUSTOM MODAL (Add / Edit) --- */}
            {/* Menggunakan Overlay manual agar kompatibel tanpa setup 'snippets' Chakra */}
            {isOpen && (
                <Box
                    position="fixed"
                    top={0}
                    left={0}
                    w="100vw"
                    h="100vh"
                    bg="blackAlpha.600"
                    zIndex={9999}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    backdropFilter="blur(4px)"
                >
                    {/* Modal Content */}
                    <Box
                        bg="white"
                        w={{ base: "90%", md: "480px" }}
                        borderRadius="xl"
                        shadow="2xl"
                        p={6}
                        animation="fade-in 0.2s"
                    >
                        <Flex justify="space-between" align="center" mb={6}>
                            <Heading size="md">{isEditing ? "Edit Member" : "Add New Member"}</Heading>
                            <IconButton
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsOpen(false)}
                                color="gray.500"
                            >
                                <X size={20} />
                            </IconButton>
                        </Flex>

                        <VStack gap={4} align="stretch">
                            <Field.Root>
                                <Field.Label fontWeight="medium">Full Name</Field.Label>
                                <Input
                                    placeholder="e.g. Sarah Chen"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </Field.Root>

                            <Field.Root>
                                <Field.Label fontWeight="medium">Email Address</Field.Label>
                                <Input
                                    type="email"
                                    placeholder="sarah@agency.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </Field.Root>

                            <Field.Root>
                                <Field.Label fontWeight="medium">Role / Position</Field.Label>
                                <Input
                                    placeholder="e.g. Senior Product Designer"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                />
                            </Field.Root>

                            <Field.Root>
                                <Field.Label fontWeight="medium">Hourly Rate (IDR)</Field.Label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 150000"
                                    value={formData.hourly_rate}
                                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                                />
                            </Field.Root>

                            <HStack justify="flex-end" pt={4} gap={3}>
                                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                                <Button
                                    colorPalette="blue"
                                    onClick={handleSave}
                                    loading={addEmployee.isPending || updateEmployee.isPending}
                                >
                                    {isEditing ? "Save Changes" : "Create Member"}
                                </Button>
                            </HStack>
                        </VStack>
                    </Box>
                </Box>
            )}
        </Box>
    )
}