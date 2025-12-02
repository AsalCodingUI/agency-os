import React, { useState } from 'react';
import {
    Box,
    Heading,
    Text,
    Stack,
    Button,
    Card,
    Badge,
    Table,
    HStack,
    SimpleGrid,
    Input,
    Textarea,
    Spinner,
    Center
} from '@chakra-ui/react';
import {
    DialogBody,
    DialogCloseTrigger,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogRoot,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Field } from "@/components/ui/field"
import { useLeave } from '../hooks/useLeave';
import { useAuthStore } from '../store/useAuthStore';
import { Plus, Calendar } from 'lucide-react';
import { toaster } from "@/components/ui/toaster"
import { Avatar } from "@/components/ui/avatar"

const Leave = () => {
    const { requests, stats, isLoading, createRequest, updateRequestStatus } = useLeave();
    const { isStakeholder } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        start_date: '',
        end_date: '',
        reason: ''
    });

    const handleSubmit = async () => {
        if (!formData.start_date || !formData.end_date || !formData.reason) {
            toaster.create({ title: "Please fill all fields", type: "error" });
            return;
        }

        try {
            await createRequest.mutateAsync(formData);
            toaster.create({ title: "Leave Request Submitted", type: "success" });
            setIsOpen(false);
            setFormData({ start_date: '', end_date: '', reason: '' });
        } catch (error) {
            toaster.create({ title: "Error", description: error.message, type: "error" });
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateRequestStatus.mutateAsync({ id, status });
            toaster.create({ title: `Request ${status}`, type: "success" });
        } catch (error) {
            toaster.create({ title: "Error", description: error.message, type: "error" });
        }
    };

    if (isLoading) {
        return <Center h="50vh"><Spinner size="xl" /></Center>;
    }

    // --- STAKEHOLDER VIEW ---
    if (isStakeholder) {
        const pendingRequests = requests?.filter(r => r.status === 'PENDING') || [];
        const approvedRequests = requests?.filter(r => r.status === 'APPROVED') || [];

        return (
            <Stack gap={8}>
                <Heading size="2xl">Leave Management (Admin)</Heading>

                {/* ADMIN STATS */}
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                    <Card.Root variant="outline" borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}>
                        <Card.Body>
                            <Stack>
                                <Text color="fg.muted" fontSize="sm">Pending Requests</Text>
                                <Heading size="2xl" color="orange.500">{pendingRequests.length}</Heading>
                            </Stack>
                        </Card.Body>
                    </Card.Root>
                    <Card.Root variant="outline" borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}>
                        <Card.Body>
                            <Stack>
                                <Text color="fg.muted" fontSize="sm">Approved (All Time)</Text>
                                <Heading size="2xl" color="green.500">{approvedRequests.length}</Heading>
                            </Stack>
                        </Card.Body>
                    </Card.Root>
                </SimpleGrid>

                {/* ALL REQUESTS TABLE */}
                <Card.Root variant="outline" borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}>
                    <Card.Header>
                        <HStack gap={2}>
                            <Calendar size={20} />
                            <Heading size="md">All Employee Requests</Heading>
                        </HStack>
                    </Card.Header>
                    <Card.Body>
                        <Table.Root striped interactive>
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader>Employee</Table.ColumnHeader>
                                    <Table.ColumnHeader>Dates</Table.ColumnHeader>
                                    <Table.ColumnHeader>Reason</Table.ColumnHeader>
                                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                                    <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {requests?.map((req) => (
                                    <Table.Row key={req.id}>
                                        <Table.Cell>
                                            <HStack>
                                                <Avatar size="sm" name={req.employees?.name} src={req.employees?.avatar_url} />
                                                <Box>
                                                    <Text fontWeight="medium">{req.employees?.name || 'Unknown'}</Text>
                                                    <Text fontSize="xs" color="fg.muted">{req.employees?.job_title}</Text>
                                                </Box>
                                            </HStack>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Text fontSize="sm">{new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}</Text>
                                        </Table.Cell>
                                        <Table.Cell>{req.reason}</Table.Cell>
                                        <Table.Cell>
                                            <Badge
                                                colorPalette={
                                                    req.status === 'APPROVED' ? 'green' :
                                                        req.status === 'REJECTED' ? 'red' : 'yellow'
                                                }
                                            >
                                                {req.status}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell textAlign="end">
                                            {req.status === 'PENDING' && (
                                                <HStack justify="end">
                                                    <Button
                                                        size="xs"
                                                        colorPalette="green"
                                                        variant="ghost"
                                                        onClick={() => handleStatusUpdate(req.id, 'APPROVED')}
                                                        loading={updateRequestStatus.isPending}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        colorPalette="red"
                                                        variant="ghost"
                                                        onClick={() => handleStatusUpdate(req.id, 'REJECTED')}
                                                        loading={updateRequestStatus.isPending}
                                                    >
                                                        Reject
                                                    </Button>
                                                </HStack>
                                            )}
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                                {requests?.length === 0 && (
                                    <Table.Row>
                                        <Table.Cell colSpan={5} textAlign="center">No requests found.</Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table.Root>
                    </Card.Body>
                </Card.Root>
            </Stack>
        );
    }

    // --- EMPLOYEE VIEW ---
    return (
        <Stack gap={8}>
            <HStack justify="space-between">
                <Heading size="2xl">Leave Management</Heading>
                <DialogRoot open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
                    <DialogTrigger asChild>
                        <Button colorPalette="blue">
                            <Plus /> New Request
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Request Leave</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Stack gap={4}>
                                <Field label="Start Date">
                                    <Input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </Field>
                                <Field label="End Date">
                                    <Input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </Field>
                                <Field label="Reason">
                                    <Textarea
                                        placeholder="Why do you need leave?"
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    />
                                </Field>
                            </Stack>
                        </DialogBody>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button colorPalette="blue" onClick={handleSubmit} loading={createRequest.isPending}>Submit</Button>
                        </DialogFooter>
                        <DialogCloseTrigger />
                    </DialogContent>
                </DialogRoot>
            </HStack>

            {/* STATS GRID */}
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
                <Card.Root variant="outline" borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}>
                    <Card.Body>
                        <Stack>
                            <Text color="fg.muted" fontSize="sm">Total Quota</Text>
                            <Heading size="2xl">{stats.total}</Heading>
                        </Stack>
                    </Card.Body>
                </Card.Root>
                <Card.Root variant="outline" borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}>
                    <Card.Body>
                        <Stack>
                            <Text color="fg.muted" fontSize="sm">Used</Text>
                            <Heading size="2xl" color="orange.500">{stats.used}</Heading>
                        </Stack>
                    </Card.Body>
                </Card.Root>
                <Card.Root variant="outline" borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}>
                    <Card.Body>
                        <Stack>
                            <Text color="fg.muted" fontSize="sm">Remaining</Text>
                            <Heading size="2xl" color="green.500">{stats.remaining}</Heading>
                        </Stack>
                    </Card.Body>
                </Card.Root>
            </SimpleGrid>

            {/* REQUESTS TABLE */}
            <Card.Root variant="outline" borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}>
                <Card.Header>
                    <HStack gap={2}>
                        <Calendar size={20} />
                        <Heading size="md">My Requests</Heading>
                    </HStack>
                </Card.Header>
                <Card.Body>
                    <Table.Root striped interactive>
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeader>Start Date</Table.ColumnHeader>
                                <Table.ColumnHeader>End Date</Table.ColumnHeader>
                                <Table.ColumnHeader>Reason</Table.ColumnHeader>
                                <Table.ColumnHeader>Status</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {requests?.map((req) => (
                                <Table.Row key={req.id}>
                                    <Table.Cell>{new Date(req.start_date).toLocaleDateString()}</Table.Cell>
                                    <Table.Cell>{new Date(req.end_date).toLocaleDateString()}</Table.Cell>
                                    <Table.Cell>{req.reason}</Table.Cell>
                                    <Table.Cell>
                                        <Badge
                                            colorPalette={
                                                req.status === 'APPROVED' ? 'green' :
                                                    req.status === 'REJECTED' ? 'red' : 'yellow'
                                            }
                                        >
                                            {req.status}
                                        </Badge>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                            {requests?.length === 0 && (
                                <Table.Row>
                                    <Table.Cell colSpan={4} textAlign="center">No leave requests found.</Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table.Root>
                </Card.Body>
            </Card.Root>
        </Stack>
    );
};

export default Leave;
