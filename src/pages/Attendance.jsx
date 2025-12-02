import React, { useState, useEffect } from 'react'
import {
    Box, Container, Stack, Heading, Text, Button, Card, Table, Badge, Flex, Spinner, HStack
} from '@chakra-ui/react'
import { Clock, History, CheckCircle, XCircle } from 'lucide-react'
import { useAttendance } from '../hooks/useAttendance'
import { toaster } from "@/components/ui/toaster"

const Attendance = () => {
    const { todaySession, history, isLoading, clockIn, clockOut } = useAttendance()
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const handleClockIn = async () => {
        try {
            await clockIn.mutateAsync();
            toaster.create({ title: "Clocked In Successfully", type: "success" });
        } catch (error) {
            toaster.create({ title: "Error Clocking In", description: error.message, type: "error" });
        }
    };

    const handleClockOut = async () => {
        if (!todaySession?.id) return;
        try {
            await clockOut.mutateAsync(todaySession.id);
            toaster.create({ title: "Clocked Out Successfully", type: "success" });
        } catch (error) {
            toaster.create({ title: "Error Clocking Out", description: error.message, type: "error" });
        }
    };

    if (isLoading) return <Flex justify="center" align="center" h="50vh"><Spinner size="xl" /></Flex>

    const isWorking = todaySession?.status === 'ON_DUTY';
    const hasFinished = todaySession?.status === 'FINISHED';

    return (
        <Container maxW="container.md" py={8}>
            <Stack gap={8}>
                <Heading size="2xl">Attendance</Heading>

                {/* HERO CARD */}
                <Card.Root variant="outline" borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}>
                    <Card.Body>
                        <Stack align="center" gap={6} py={8}>
                            <Stack align="center" gap={2}>
                                <Text fontSize="lg" color="fg.muted">
                                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </Text>
                                <Heading size="4xl">
                                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </Heading>
                                <Badge
                                    size="lg"
                                    colorPalette={isWorking ? "green" : hasFinished ? "gray" : "red"}
                                    variant="solid"
                                >
                                    {isWorking ? "WORKING" : hasFinished ? "FINISHED" : "OFFLINE"}
                                </Badge>
                                {isWorking && todaySession?.clock_in && (
                                    <Text fontSize="xl" fontWeight="bold" color="green.600">
                                        Duration: {new Date(currentTime - new Date(todaySession.clock_in)).toISOString().substr(11, 8)}
                                    </Text>
                                )}
                            </Stack>

                            {!hasFinished && (
                                <Button
                                    size="xl"
                                    colorPalette={isWorking ? "red" : "green"}
                                    onClick={isWorking ? handleClockOut : handleClockIn}
                                    loading={clockIn.isPending || clockOut.isPending}
                                    minW="200px"
                                >
                                    {isWorking ? (
                                        <><XCircle /> Clock Out</>
                                    ) : (
                                        <><CheckCircle /> Clock In</>
                                    )}
                                </Button>
                            )}
                            {hasFinished && (
                                <Text color="fg.muted">You have completed your shift for today.</Text>
                            )}
                        </Stack>
                    </Card.Body>
                </Card.Root>

                {/* HISTORY TABLE */}
                <Card.Root variant="outline" borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}>
                    <Card.Header>
                        <HStack gap={2}>
                            <History size={20} />
                            <Heading size="md">Recent Activity</Heading>
                        </HStack>
                    </Card.Header>
                    <Card.Body>
                        <Table.Root striped interactive>
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader>Date</Table.ColumnHeader>
                                    <Table.ColumnHeader>Clock In</Table.ColumnHeader>
                                    <Table.ColumnHeader>Clock Out</Table.ColumnHeader>
                                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {history?.map((session) => (
                                    <Table.Row key={session.id}>
                                        <Table.Cell>{new Date(session.date).toLocaleDateString()}</Table.Cell>
                                        <Table.Cell>
                                            {session.clock_in ? new Date(session.clock_in).toLocaleTimeString() : '-'}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {session.clock_out ? new Date(session.clock_out).toLocaleTimeString() : '-'}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge
                                                colorPalette={session.status === 'ON_DUTY' ? 'green' : 'gray'}
                                                variant="subtle"
                                            >
                                                {session.status}
                                            </Badge>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                                {history?.length === 0 && (
                                    <Table.Row>
                                        <Table.Cell colSpan={4} textAlign="center">No recent activity</Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table.Root>
                    </Card.Body>
                </Card.Root>
            </Stack>
        </Container>
    )
}

export default Attendance
