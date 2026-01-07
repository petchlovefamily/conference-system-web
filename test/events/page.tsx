'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { eventsApi, EventWithTickets } from '@/lib/api';

export default function EventsPage() {
    const [events, setEvents] = useState<EventWithTickets[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const response = await eventsApi.list();
            if (response.success) {
                setEvents(response.data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            draft: 'bg-secondary-subtle text-secondary',
            published: 'bg-success-subtle text-success',
            cancelled: 'bg-danger-subtle text-danger',
            completed: 'bg-info-subtle text-info',
        };
        return badges[status] || 'bg-secondary-subtle text-secondary';
    };

    return (
        <>
            {/* Page Title */}
            <div className="row">
                <div className="col-12">
                    <div className="page-title-box">
                        <div className="page-title-right">
                            <Link href="/events/create" className="btn btn-primary">
                                <i className="ti ti-plus me-1"></i> Create Event
                            </Link>
                        </div>
                        <h4 className="page-title">Events</h4>
                    </div>
                </div>
            </div>

            {/* Events Table */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title mb-0">All Events</h4>
                            <button className="btn btn-sm btn-light" onClick={loadEvents}>
                                <i className="ti ti-refresh me-1"></i> Refresh
                            </button>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-2 text-muted">Loading events...</p>
                                </div>
                            ) : error ? (
                                <div className="alert alert-danger">
                                    <i className="ti ti-alert-circle me-2"></i>
                                    {error}
                                    <button className="btn btn-sm btn-danger ms-3" onClick={loadEvents}>
                                        Retry
                                    </button>
                                </div>
                            ) : events.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="ti ti-calendar-off fs-48 text-muted"></i>
                                    <p className="mt-2 text-muted">No events found</p>
                                    <Link href="/events/create" className="btn btn-primary">
                                        Create First Event
                                    </Link>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover table-centered mb-0">
                                        <thead>
                                            <tr>
                                                <th>Event</th>
                                                <th>Date</th>
                                                <th>Sessions</th>
                                                <th>Tickets</th>
                                                <th>Capacity</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {events.map((event) => (
                                                <tr key={event.id}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="avatar-sm bg-primary-subtle rounded me-2 d-flex align-items-center justify-content-center">
                                                                <i className="ti ti-calendar text-primary"></i>
                                                            </div>
                                                            <div>
                                                                <h5 className="mb-0 fs-14">{event.eventName}</h5>
                                                                <small className="text-muted">
                                                                    {event.eventCode}
                                                                    {event.eventType === 'multi_session' && (
                                                                        <span className="badge bg-info-subtle text-info ms-1">Multi</span>
                                                                    )}
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <span>{formatDate(event.startDate)}</span>
                                                            {event.startDate !== event.endDate && (
                                                                <>
                                                                    <br />
                                                                    <small className="text-muted">
                                                                        to {formatDate(event.endDate)}
                                                                    </small>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {event.eventType === 'multi_session' ? (
                                                            <span className="badge bg-info">
                                                                <i className="ti ti-layout-grid me-1"></i>
                                                                {event.sessions?.length || 0}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-warning">
                                                            <i className="ti ti-ticket me-1"></i>
                                                            {event.ticketTypes?.length || 0}
                                                        </span>
                                                    </td>
                                                    <td>{event.maxCapacity}</td>
                                                    <td>
                                                        <span className={`badge ${getStatusBadge(event.status)}`}>
                                                            {event.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="btn-group">
                                                            <Link
                                                                href={`/events/${event.id}`}
                                                                className="btn btn-sm btn-light"
                                                                title="View"
                                                            >
                                                                <i className="ti ti-eye"></i>
                                                            </Link>
                                                            <Link
                                                                href={`/events/${event.id}/edit`}
                                                                className="btn btn-sm btn-light"
                                                                title="Edit"
                                                            >
                                                                <i className="ti ti-pencil"></i>
                                                            </Link>
                                                            <Link
                                                                href={`/events/${event.id}/registrations`}
                                                                className="btn btn-sm btn-light"
                                                                title="Registrations"
                                                            >
                                                                <i className="ti ti-users"></i>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
