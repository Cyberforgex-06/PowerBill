"use client";

import { useEffect, useState } from "react";
import { Link2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, FieldLabel, Input, Select } from "@/components/ui/field";
import { ApiError, apiRequest } from "@/lib/api";
import type { Meter, PageResult, Tariff, User } from "@/lib/types";

export function AssignMeterForm({ tariffs }: { tariffs: Tariff[] }) {
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<User[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customerError, setCustomerError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoadingCustomers(true);
      setCustomerError("");
      try {
        const result = await apiRequest<PageResult<User>>(
          "/api/v1/staff/customers?q=" + encodeURIComponent(query.trim()),
          { signal: controller.signal },
        );
        if (active) setCustomers(result.items);
      } catch (error) {
        if (active) {
          setCustomers([]);
          setCustomerError(error instanceof ApiError ? error.message : "Could not load customers.");
        }
      } finally {
        if (active) setLoadingCustomers(false);
      }
    }, 250);
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setMessage("");
    const data = {
      customer_id: customerId,
      tariff_id: String(new FormData(event.currentTarget).get("tariff_id") ?? ""),
      meter_number: String(new FormData(event.currentTarget).get("meter_number") ?? "").trim(),
      opening_reading: String(new FormData(event.currentTarget).get("opening_reading") ?? "").trim(),
    };
    if (!data.customer_id || !data.tariff_id || !data.meter_number || !data.opening_reading) {
      setMessage("Select a customer and complete every field.");
      return;
    }
    setBusy(true);
    try {
      await apiRequest<{ meter: Meter }>("/api/v1/staff/meters", {
        method: "POST",
        body: JSON.stringify(data),
      });
      window.location.assign("/staff/meters");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fields ?? {});
        setMessage(error.message);
      } else {
        setMessage("Meter could not be assigned.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl">
      <Card className="p-5 md:p-7">
        <div>
          <FieldLabel htmlFor="customer_search">Find customer</FieldLabel>
          <div className="relative">
            <Search aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-4 text-info" />
            <Input
              id="customer_search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCustomerId("");
              }}
              placeholder="Search by customer name or email"
              autoComplete="off"
              className="pl-10"
            />
          </div>
          <p className="mt-2 text-xs leading-5 text-info">
            Search registered customers by name or email. No customer UUID is needed.
          </p>
        </div>

        <div className="mt-5">
          <FieldLabel htmlFor="customer_id">Customer</FieldLabel>
          <Select
            id="customer_id"
            name="customer_id"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            disabled={loadingCustomers || Boolean(customerError) || customers.length === 0}
            required
          >
            <option value="" disabled>
              {loadingCustomers ? "Loading customers…" : customers.length ? "Select customer" : "No customers found"}
            </option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.full_name} — {customer.email}
              </option>
            ))}
          </Select>
          <FieldError>{errors.customer_id || customerError}</FieldError>
          {!loadingCustomers && !customerError && customers.length > 0 ? (
            <p className="mt-2 text-xs text-info">Showing up to 20 matches. Refine your search to find other customers.</p>
          ) : null}
          {!loadingCustomers && !customerError && customers.length === 0 ? (
            <p className="mt-2 text-xs text-info">Register a customer account first, or try another search.</p>
          ) : null}
        </div>

        <div className="mt-5">
          <FieldLabel htmlFor="tariff_id">Active tariff</FieldLabel>
          <Select id="tariff_id" name="tariff_id" required defaultValue="">
            <option value="" disabled>Select tariff</option>
            {tariffs.filter((tariff) => tariff.is_active).map((tariff) => (
              <option key={tariff.id} value={tariff.id}>{tariff.name}</option>
            ))}
          </Select>
          <FieldError>{errors.tariff_id}</FieldError>
        </div>
        <div className="mt-5">
          <FieldLabel htmlFor="meter_number">Meter number</FieldLabel>
          <Input id="meter_number" name="meter_number" autoComplete="off" maxLength={48} required />
          <FieldError>{errors.meter_number}</FieldError>
        </div>
        <div className="mt-5">
          <FieldLabel htmlFor="opening_reading">Opening reading (kWh)</FieldLabel>
          <Input id="opening_reading" name="opening_reading" inputMode="decimal" autoComplete="off" required />
          <FieldError>{errors.opening_reading}</FieldError>
        </div>
        {message ? <p role="alert" className="mt-4 text-sm text-status-overdue">{message}</p> : null}
        <Button aria-busy={busy} disabled={busy || loadingCustomers || Boolean(customerError)} className="mt-6 w-full sm:w-auto" type="submit">
          <Link2 size={17} strokeWidth={1.8} />
          {busy ? "Assigning…" : "Assign meter"}
        </Button>
      </Card>
    </form>
  );
}
