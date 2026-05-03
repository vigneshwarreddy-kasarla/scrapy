package com.fillos.backend.address;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public final class AddressDtos {
    private AddressDtos() {}

    public record CreateAddressRequest(
            @Size(max = 80) String label,
            @NotBlank @Size(max = 200) String line1,
            @Size(max = 200) String line2,
            @NotBlank @Size(max = 100) String city,
            @Size(max = 100) String region,
            @NotBlank @Size(max = 20) String postalCode,
            /** ISO country code; defaults to {@code US} when null or blank. */
            @Size(min = 2, max = 2) String country,
            boolean isDefault) {}

    public record UpdateAddressRequest(
            @Size(max = 80) String label,
            @Size(max = 200) String line1,
            @Size(max = 200) String line2,
            @Size(max = 100) String city,
            @Size(max = 100) String region,
            @Size(max = 20) String postalCode,
            @Size(min = 2, max = 2) String country,
            Boolean isDefault) {}

    public record AddressResponse(
            UUID id,
            String label,
            String line1,
            String line2,
            String city,
            String region,
            String postalCode,
            String country,
            boolean isDefault,
            Instant createdAt) {}
}
