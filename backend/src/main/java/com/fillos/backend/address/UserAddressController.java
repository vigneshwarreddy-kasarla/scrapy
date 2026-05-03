package com.fillos.backend.address;

import com.fillos.backend.address.AddressDtos.AddressResponse;
import com.fillos.backend.address.AddressDtos.CreateAddressRequest;
import com.fillos.backend.address.AddressDtos.UpdateAddressRequest;
import com.fillos.backend.security.AppUserDetails;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me/addresses")
public class UserAddressController {
    private final AddressService addressService;

    public UserAddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    public List<AddressResponse> list(@AuthenticationPrincipal AppUserDetails principal) {
        return addressService.list(principal.getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AddressResponse create(
            @AuthenticationPrincipal AppUserDetails principal, @Valid @RequestBody CreateAddressRequest body) {
        return addressService.create(principal.getId(), body);
    }

    @PatchMapping("/{addressId}")
    public AddressResponse patch(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable("addressId") UUID addressId,
            @Valid @RequestBody UpdateAddressRequest body) {
        return addressService.update(principal.getId(), addressId, body);
    }

    @DeleteMapping("/{addressId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal AppUserDetails principal, @PathVariable("addressId") UUID addressId) {
        addressService.delete(principal.getId(), addressId);
    }
}
