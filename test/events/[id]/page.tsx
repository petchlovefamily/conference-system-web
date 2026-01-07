'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { eventsApi, ticketTypesApi, EventWithTickets, Registration, TicketType } from '@/lib/api';

type Tab = 'overview' | 'tickets' | 'registrations';

export default function EventDetailPage() {
    const params = useParams();
    const eventId = parseInt(params.id as string);

    const [activeTab, setActiveTab] = useState<Tab>('overview');

    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<EventWithTickets | null>(null);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Ticket form state
    const [showTicketForm, setShowTicketForm] = useState(false);
    const [ticketLoading, setTicketLoading] = useState(false);
    const [ticketForm, setTicketForm] = useState<{
        name: string;
        description: string;
        price: string;
        quota: number;
        category: 'primary' | 'addon';
    }>({
        name: '',
        description: '',
        price: '',
        quota: 100,
        category: 'primary',
    });

    useEffect(() => {
        loadData();
    }, [eventId]);

    const loadData = async () => {
        try {
            setLoading(true);

            const eventRes = await eventsApi.get(eventId);
            if (eventRes.success && eventRes.data) {
                setEvent(eventRes.data);
            }

            const regRes = await eventsApi.getRegistrations(eventId);
            if (regRes.success) {
                setRegistrations(regRes.data);
            }
        } catch (err) {
            console.error('Failed to load event:', err);
            setError(err instanceof Error ? err.message : 'Failed to load event');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setTicketLoading(true);

        try {
            const response = await ticketTypesApi.create(eventId, {
                name: ticketForm.name,
                description: ticketForm.description || undefined,
                price: ticketForm.price,
                quota: ticketForm.quota,
                category: ticketForm.category,
            });

            if (response.success) {
                setShowTicketForm(false);
                setTicketForm({ name: '', description: '', price: '', quota: 100, category: 'primary' });
                loadData(); // Reload to show new ticket
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add ticket type');
        } finally {
            setTicketLoading(false);
        }
    };

    const handleDeleteTicket = async (ticketId: number) => {
        if (!confirm('Are you sure you want to delete this ticket type?')) return;

        try {
            await ticketTypesApi.delete(ticketId);
            loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete ticket type');
        }
    };

    const handleToggleTicket = async (ticket: TicketType) => {
        try {
            await ticketTypesApi.update(ticket.id, { isActive: !ticket.isActive });
            loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update ticket type');
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            draft: 'bg-secondary',
            published: 'bg-success',
            cancelled: 'bg-danger',
            completed: 'bg-info',
        };
        return badges[status] || 'bg-secondary';
    };

    const getRegStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            pending: 'bg-warning',
            confirmed: 'bg-success',
            checked_in: 'bg-info',
            cancelled: 'bg-danger',
        };
        return badges[status] || 'bg-secondary';
    };

    if (loading) {
        return (
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3 mb-0">Loading event...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body text-center py-5">
                            <i className="ti ti-alert-circle text-danger fs-1"></i>
                            <h4 className="mt-3">Event Not Found</h4>
                            <p className="text-muted">{error || 'The event you are looking for does not exist.'}</p>
                            <Link href="/events" className="btn btn-primary">
                                <i className="ti ti-arrow-left me-1"></i> Back to Events
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* Page Title & Header */}
            <div className="row">
                <div className="col-12">
                    <div className="page-title-box">
                        <div className="page-title-right d-flex gap-2">
                            <Link href={`/events/${eventId}/edit`} className="btn btn-primary d-flex align-items-center">
                                <i className="ti ti-edit me-1"></i> <span className="d-none d-sm-inline">Edit Event</span>
                            </Link>
                            <Link href="/events" className="btn btn-secondary d-flex align-items-center">
                                <i className="ti ti-arrow-left me-1"></i> <span className="d-none d-sm-inline">Back</span>
                            </Link>
                        </div>
                        <h4 className="page-title">{event.eventName}</h4>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="ti ti-alert-circle me-2"></i>
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close"></button>
                </div>
            )}

            {/* Tabs */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="nav nav-pills bg-white p-2 rounded shadow-sm d-flex flex-column flex-sm-row gap-2">
                        <button
                            className={`nav-link text-start text-sm-center ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            <i className="ti ti-dashboard me-1"></i> Overview
                        </button>
                        <button
                            className={`nav-link text-start text-sm-center ${activeTab === 'tickets' ? 'active' : ''}`}
                            onClick={() => setActiveTab('tickets')}
                        >
                            <i className="ti ti-ticket me-1"></i>
                            Ticket Types
                            <span className="badge bg-light text-dark ms-2">{event.ticketTypes?.length || 0}</span>
                        </button>
                        <button
                            className={`nav-link text-start text-sm-center ${activeTab === 'registrations' ? 'active' : ''}`}
                            onClick={() => setActiveTab('registrations')}
                        >
                            <i className="ti ti-users me-1"></i>
                            Registrations
                            <span className="badge bg-light text-dark ms-2">{registrations.length}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="row">
                {activeTab === 'overview' && (
                    <>
                        <div className="col-lg-8 mb-4 mb-lg-0">
                            <div className="card h-100">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h4 className="card-title mb-0">Event Details</h4>
                                    <span className={`badge ${getStatusBadge(event.status)} text-uppercase`}>
                                        {event.status}
                                    </span>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <p className="mb-2"><strong>Event Code:</strong> {event.eventCode}</p>
                                            <p className="mb-2"><strong>Event Type:</strong> {event.eventType === 'multi_session' ? 'Multi Session' : 'Single Room'}</p>
                                            <p className="mb-2"><strong>Location:</strong> {event.location || '-'}</p>
                                            <p className="mb-0"><strong>Max Capacity:</strong> {event.maxCapacity}</p>
                                        </div>
                                        <div className="col-md-6">
                                            <p className="mb-2"><strong>Start Date:</strong> {new Date(event.startDate).toLocaleString('th-TH')}</p>
                                            <p className="mb-2"><strong>End Date:</strong> {new Date(event.endDate).toLocaleString('th-TH')}</p>
                                            <p className="mb-0"><strong>CPE Credits:</strong> {event.cpeCredits || '-'}</p>
                                        </div>
                                    </div>
                                    {event.description && (
                                        <div className="mt-4 pt-3 border-top">
                                            <strong>Description:</strong>
                                            <p className="text-muted mt-2 mb-0">{event.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4">
                            <div className="row g-4">
                                {/* Stats */}
                                <div className="col-12">
                                    <div className="card mb-0">
                                        <div className="card-header">
                                            <h4 className="card-title mb-0">Statistics</h4>
                                        </div>
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between mb-3">
                                                <span>Total Registrations</span>
                                                <strong>{registrations.length}</strong>
                                            </div>
                                            <div className="d-flex justify-content-between mb-3">
                                                <span>Confirmed</span>
                                                <strong className="text-success">
                                                    {registrations.filter(r => r.status === 'confirmed').length}
                                                </strong>
                                            </div>
                                            <div className="d-flex justify-content-between mb-3">
                                                <span>Checked In</span>
                                                <strong className="text-info">
                                                    {registrations.filter(r => r.status === 'checked_in').length}
                                                </strong>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span>Capacity Used</span>
                                                <strong>
                                                    {Math.round((registrations.length / event.maxCapacity) * 100)}%
                                                </strong>
                                            </div>
                                            <div className="progress mt-2" style={{ height: '8px' }}>
                                                <div
                                                    className="progress-bar"
                                                    style={{ width: `${Math.min((registrations.length / event.maxCapacity) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="col-12">
                                    <div className="card mb-0">
                                        <div className="card-header">
                                            <h4 className="card-title mb-0">Quick Actions</h4>
                                        </div>
                                        <div className="card-body d-grid gap-2">
                                            <Link href={`/public/events/${eventId}`} className="btn btn-outline-primary" target="_blank">
                                                <i className="ti ti-external-link me-1"></i>
                                                View Public Page
                                            </Link>
                                            <Link href="/check-in" className="btn btn-outline-success">
                                                <i className="ti ti-qrcode me-1"></i>
                                                Go to Check-in
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'tickets' && (
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
                                <div>
                                    <h4 className="card-title mb-0">Manage Ticket Types</h4>
                                    <p className="text-muted mb-0 fs-13">Configure tickets (Primary) and supplements (Add-on).</p>
                                </div>
                                <button
                                    className="btn btn-primary w-100 w-sm-auto"
                                    onClick={() => setShowTicketForm(!showTicketForm)}
                                >
                                    <i className={`ti ti-${showTicketForm ? 'x' : 'plus'} me-1`}></i>
                                    {showTicketForm ? 'Cancel' : 'Add Ticket'}
                                </button>
                            </div>
                            <div className="card-body">
                                {/* Add Ticket Form */}
                                {showTicketForm && (
                                    <form onSubmit={handleAddTicket} className="mb-4 p-4 bg-light rounded border">
                                        <h5 className="mb-3">New Ticket Type</h5>
                                        <div className="row g-3">
                                            <div className="col-lg-4 col-md-6">
                                                <label className="form-label">Category *</label>
                                                <div className="d-flex flex-column flex-sm-row gap-3 mt-1">
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="category"
                                                            id="cat_primary"
                                                            checked={ticketForm.category === 'primary'}
                                                            onChange={() => setTicketForm(f => ({ ...f, category: 'primary' }))}
                                                        />
                                                        <label className="form-check-label" htmlFor="cat_primary">
                                                            Primary Ticket
                                                        </label>
                                                    </div>
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="category"
                                                            id="cat_addon"
                                                            checked={ticketForm.category === 'addon'}
                                                            onChange={() => setTicketForm(f => ({ ...f, category: 'addon' }))}
                                                        />
                                                        <label className="form-check-label" htmlFor="cat_addon">
                                                            Add-on
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-lg-4 col-md-6">
                                                <label className="form-label">Ticket Name *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={ticketForm.name}
                                                    onChange={(e) => setTicketForm(f => ({ ...f, name: e.target.value }))}
                                                    placeholder="e.g. Early Bird, Gala Dinner"
                                                    required
                                                />
                                            </div>

                                            <div className="col-lg-2 col-md-6">
                                                <label className="form-label">Price (฿) *</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={ticketForm.price}
                                                    onChange={(e) => setTicketForm(f => ({ ...f, price: e.target.value }))}
                                                    placeholder="0"
                                                    required
                                                />
                                            </div>
                                            <div className="col-lg-2 col-md-6">
                                                <label className="form-label">Quota *</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={ticketForm.quota}
                                                    onChange={(e) => setTicketForm(f => ({ ...f, quota: parseInt(e.target.value) }))}
                                                    min="0"
                                                    required
                                                />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label">Description</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={ticketForm.description}
                                                    onChange={(e) => setTicketForm(f => ({ ...f, description: e.target.value }))}
                                                    placeholder="Optional description"
                                                />
                                            </div>
                                            <div className="col-12 text-end">
                                                <button type="submit" className="btn btn-success" disabled={ticketLoading}>
                                                    {ticketLoading ? (
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                    ) : (
                                                        <i className="ti ti-check me-1"></i>
                                                    )}
                                                    Save Ticket
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                )}

                                {/* Ticket List */}
                                {event.ticketTypes && event.ticketTypes.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0" style={{ minWidth: '800px' }}>
                                            <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: '100px' }}>Category</th>
                                                    <th>Name</th>
                                                    <th style={{ width: '120px' }}>Price</th>
                                                    <th style={{ width: '100px' }}>Quota</th>
                                                    <th style={{ width: '150px' }}>Sold</th>
                                                    <th style={{ width: '100px' }}>Status</th>
                                                    <th className="text-end" style={{ width: '100px' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {event.ticketTypes.map((ticket) => (
                                                    <tr key={ticket.id}>
                                                        <td>
                                                            {ticket.category === 'primary' ? (
                                                                <span className="badge bg-primary-subtle text-primary border border-primary-subtle">Primary</span>
                                                            ) : (
                                                                <span className="badge bg-purple-subtle text-purple border border-purple-subtle">Add-on</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className="fw-bold text-truncate" style={{ maxWidth: '200px' }}>{ticket.name}</div>
                                                            {ticket.description && (
                                                                <small className="text-muted d-block text-truncate" style={{ maxWidth: '200px' }}>{ticket.description}</small>
                                                            )}
                                                        </td>
                                                        <td>฿{parseFloat(ticket.price).toLocaleString()}</td>
                                                        <td>{ticket.quota}</td>
                                                        <td>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div className="progress flex-grow-1" style={{ width: '60px', height: '4px' }}>
                                                                    <div
                                                                        className={`progress-bar ${ticket.soldCount >= ticket.quota ? 'bg-danger' : 'bg-success'}`}
                                                                        style={{ width: `${Math.min((ticket.soldCount / ticket.quota) * 100, 100)}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="fs-12">{ticket.soldCount}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={ticket.isActive}
                                                                    onChange={() => handleToggleTicket(ticket)}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="text-end">
                                                            <button
                                                                className="btn btn-icon btn-sm btn-light-danger"
                                                                onClick={() => handleDeleteTicket(ticket.id)}
                                                                title="Delete"
                                                            >
                                                                <i className="ti ti-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <div className="empty-state-icon bg-light-primary text-primary mx-auto mb-3" style={{ width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className="ti ti-ticket fs-24"></i>
                                        </div>
                                        <h5 className="mb-2">No Ticket Types Defined</h5>
                                        <p className="text-muted mb-3">Start by adding a primary ticket for your event.</p>
                                        <button className="btn btn-outline-primary" onClick={() => setShowTicketForm(true)}>
                                            <i className="ti ti-plus me-1"></i> Add First Ticket
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'registrations' && (
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
                                <h4 className="card-title mb-0">
                                    Registrations
                                    <span className="badge bg-primary ms-2">{registrations.length}</span>
                                </h4>
                                <button className="btn btn-outline-secondary btn-sm w-100 w-sm-auto">
                                    <i className="ti ti-download me-1"></i> Export CSV
                                </button>
                            </div>
                            <div className="card-body p-0">
                                {registrations.length === 0 ? (
                                    <div className="text-center py-5">
                                        <i className="ti ti-users text-muted fs-1 opacity-50"></i>
                                        <p className="text-muted mt-3 mb-0">No registrations yet</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0" style={{ minWidth: '800px' }}>
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Reg Code</th>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Type</th>
                                                    <th>Paid (THB)</th>
                                                    <th>Status</th>
                                                    <th>Registered</th>
                                                    <th className="text-end">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {registrations.map((reg) => (
                                                    <tr key={reg.id}>
                                                        <td><code className="text-primary fw-bold">{reg.regCode}</code></td>
                                                        <td>
                                                            <div className="fw-medium">{reg.firstName} {reg.lastName}</div>
                                                            {reg.organization && <div className="small text-muted">{reg.organization}</div>}
                                                        </td>
                                                        <td>{reg.email}</td>
                                                        <td>
                                                            <span className="badge bg-light text-dark text-capitalize border">
                                                                {reg.attendeeType}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {/* Placeholder for payment amount if available in registration object, typically fetched separately or added to view */}
                                                            -
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${getRegStatusBadge(reg.status)} text-capitalize`}>
                                                                {reg.status.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td>{new Date(reg.createdAt).toLocaleDateString('th-TH')}</td>
                                                        <td className="text-end">
                                                            <button className="btn btn-sm btn-icon btn-light" title="View Details">
                                                                <i className="ti ti-eye"></i>
                                                            </button>
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
                )}
            </div>
        </div>
    );
}
