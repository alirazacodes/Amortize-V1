
;; equity-multi-claim
;; <add a description here>

;; constants

;; data maps and vars
(define-data-var v-share uint u0)
(define-data-var add-to-remove (optional principal) none)
(define-data-var beneficiaries (list 10 principal) (list))


;; private functions
(define-private (distribute (beneficier principal))
    (begin
        (asserts! (is-eq (as-contract (stx-transfer? (var-get v-share) tx-sender beneficier)) (ok true)) false)
        true
    )
)

(define-private (filter-last-beneficier (beneficier principal))
    (not (is-eq (unwrap-panic (element-at (var-get beneficiaries) (- (len (var-get beneficiaries)) u1))) beneficier))
)

;; public functions
(define-public (multi-claim)
    (begin
        (try! (as-contract (contract-call? .btc-lock claim)))
        (let
            (
                (second-last (filter filter-last-beneficier (var-get beneficiaries)))
                (total-balance (as-contract (stx-get-balance tx-sender)))
                (share (/ total-balance (len (var-get beneficiaries))))
            )
            (var-set v-share share)
            ;;(filter distribute second-last)
            ;;(try! (as-contract (stx-transfer? (stx-get-balance tx-sender) tx-sender (unwrap-panic (element-at (var-get beneficiaries) (- (len (var-get beneficiaries)) u1))))))
            (ok true)
        )
    )
)

(define-private (remove-duplicate (address principal))
    (not (is-eq address (unwrap-panic (var-get add-to-remove))))
)

(define-public (add-beneficiary (beneficiant principal))
    (begin
        (asserts! (< (len (var-get beneficiaries)) u10) (err (var-get beneficiaries)))
        (var-set add-to-remove (some beneficiant))
        (var-set beneficiaries (filter remove-duplicate (var-get beneficiaries)))
        (var-set beneficiaries (unwrap-panic (as-max-len? (append (var-get beneficiaries) beneficiant) u10)))
        (ok (var-get beneficiaries))
    )
)