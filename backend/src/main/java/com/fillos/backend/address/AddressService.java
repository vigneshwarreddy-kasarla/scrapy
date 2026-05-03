package com.fillos.backend.address;

import com.fillos.backend.address.AddressDtos.AddressResponse;
import com.fillos.backend.address.AddressDtos.CreateAddressRequest;
import com.fillos.backend.address.AddressDtos.UpdateAddressRequest;
import com.fillos.backend.address.AddressRepository.AddressRow;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AddressService {
    private final AddressRepository addresses;

    public AddressService(AddressRepository addresses) {
        this.addresses = addresses;
    }

    public List<AddressResponse> list(UUID userId) {
        return addresses.listByUserId(userId);
    }

    @Transactional
    public AddressResponse create(UUID userId, CreateAddressRequest req) {
        String country =
                req.country() == null || req.country().isBlank() ? "US" : req.country().trim().toUpperCase();
        if (country.length() != 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "country must be a 2-letter code");
        }
        if (req.isDefault()) {
            addresses.clearDefaultForUser(userId);
        }
        UUID id =
                addresses.insert(
                        userId,
                        trimToNull(req.label()),
                        req.line1().trim(),
                        trimToNull(req.line2()),
                        req.city().trim(),
                        trimToNull(req.region()),
                        req.postalCode().trim(),
                        country,
                        req.isDefault());
        return addresses
                .findResponseByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Address not found"));
    }

    @Transactional
    public AddressResponse update(UUID userId, UUID addressId, UpdateAddressRequest req) {
        AddressRow current =
                addresses.findByIdAndUserId(addressId, userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found"));
        if (!hasAnyPatch(req)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No fields to update");
        }
        String label = req.label() != null ? trimToNull(req.label()) : current.label();
        String line1 = req.line1() != null ? req.line1().trim() : current.line1();
        String line2 = req.line2() != null ? trimToNull(req.line2()) : current.line2();
        String city = req.city() != null ? req.city().trim() : current.city();
        String region = req.region() != null ? trimToNull(req.region()) : current.region();
        String postal = req.postalCode() != null ? req.postalCode().trim() : current.postalCode();
        String country = current.country();
        if (req.country() != null) {
            if (req.country().isBlank()) {
                country = "US";
            } else {
                country = req.country().trim().toUpperCase();
                if (country.length() != 2) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "country must be a 2-letter code");
                }
            }
        }
        boolean isDefault = req.isDefault() != null ? req.isDefault() : current.isDefault();
        if (Boolean.TRUE.equals(req.isDefault())) {
            addresses.clearDefaultForUser(userId);
        }
        if (addresses.updateAddress(addressId, userId, label, line1, line2, city, region, postal, country, isDefault)
                == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found");
        }
        return addresses
                .findResponseByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found"));
    }

    @Transactional
    public void delete(UUID userId, UUID addressId) {
        if (addresses.delete(addressId, userId) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found");
        }
    }

    /** Snapshot text for an order, or throws {@code 404} if the address is not owned by the user. */
    public String snapshotForCheckout(UUID userId, UUID addressId) {
        AddressRow row =
                addresses.findByIdAndUserId(addressId, userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found"));
        return AddressRepository.formatSnapshot(row);
    }

    private static boolean hasAnyPatch(UpdateAddressRequest req) {
        return req.label() != null
                || req.line1() != null
                || req.line2() != null
                || req.city() != null
                || req.region() != null
                || req.postalCode() != null
                || req.country() != null
                || req.isDefault() != null;
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
