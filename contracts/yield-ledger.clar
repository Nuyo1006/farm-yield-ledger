;; farm-yield-ledger: A comprehensive blockchain-based agricultural data ledger
;; Enables immutable record-keeping for crop production, field management, and supply chain verification

;; Error constants for operation results
(define-constant fail-unauthorized (err u100))
(define-constant fail-not-found (err u101))
(define-constant fail-already-registered (err u102))
(define-constant fail-invalid-params (err u103))
(define-constant fail-field-invalid (err u104))
(define-constant fail-planting-invalid (err u105))
(define-constant fail-field-not-ready (err u106))
(define-constant fail-verifier-not-registered (err u107))

;; Counters for auto-incrementing record IDs
(define-data-var field-counter uint u1)
(define-data-var planting-counter uint u1)
(define-data-var harvest-counter uint u1)
(define-data-var attestation-counter uint u1)

;; Agent directory - maps principal to account metadata
(define-map producer-directory
  { principal: principal }
  {
    full-name: (string-ascii 100),
    region: (string-ascii 100),
    joined-at: uint,
    enabled: bool
  }
)

;; Land registry - maps plot identifier to plot details
(define-map land-registry
  { plot-id: uint }
  {
    owner: principal,
    coordinates: (string-ascii 255),
    area-hectares: uint,
    terrain-composition: (string-ascii 50),
    registered-at: uint,
    enabled: bool
  }
)

;; Crop cycle records - documents cultivation periods
(define-map crop-cycles
  { cycle-id: uint }
  {
    plot-id: uint,
    owner: principal,
    variety: (string-ascii 100),
    started-at: uint,
    materials-applied: (string-ascii 255),
    notes: (string-ascii 255)
  }
)

;; Production records - captures yield information
(define-map production-records
  { production-id: uint }
  {
    cycle-id: uint,
    plot-id: uint,
    owner: principal,
    output-weight: uint,
    grade-assessment: (string-ascii 255),
    completed-at: uint,
    notes: (string-ascii 255)
  }
)

;; Certifier registry - authorized third-party organizations
(define-map certifier-registry
  { certifier: principal }
  {
    organization: (string-ascii 100),
    specialization: (string-ascii 100),
    registered-at: uint,
    enabled: bool
  }
)

;; Attestation ledger - verification records from certifiers
(define-map attestation-ledger
  { attestation-id: uint }
  {
    certifier: principal,
    subject-class: (string-ascii 20),
    subject-id: uint,
    certified-at: uint,
    outcome: (string-ascii 20),
    remarks: (string-ascii 255)
  }
)

;; Permission matrix - manages data visibility rules
(define-map permission-matrix
  { record-class: (string-ascii 20), record-id: uint, viewer: principal }
  { 
    approved-by: principal,
    granted-when: uint,
    tier: (string-ascii 20)
  }
)

;; ============================================================================
;; PRIVATE HELPERS
;; ============================================================================

;; Determines if a principal holds a producer account
(define-private (has-producer-account (account principal))
  (default-to false (get enabled (map-get? producer-directory { principal: account })))
)

;; Validates ownership of a specific plot
(define-private (owns-plot (plot-id uint) (account principal))
  (match (map-get? land-registry { plot-id: plot-id })
    plot-info (is-eq (get owner plot-info) account)
    false
  )
)

;; Determines if a plot has an active cultivation cycle
(define-private (has-active-cycle (plot-id uint))
  (is-some (map-get? crop-cycles { cycle-id: plot-id }))
)

;; Determines if a principal is registered as a certifier
(define-private (is-certifier (account principal))
  (default-to false (get enabled (map-get? certifier-registry { certifier: account })))
)

;; Generate and advance field counter
(define-private (next-plot-id)
  (let ((current (var-get field-counter)))
    (var-set field-counter (+ current u1))
    current
  )
)

;; Generate and advance planting counter
(define-private (next-cycle-id)
  (let ((current (var-get planting-counter)))
    (var-set planting-counter (+ current u1))
    current
  )
)

;; Generate and advance harvest counter
(define-private (next-production-id)
  (let ((current (var-get harvest-counter)))
    (var-set harvest-counter (+ current u1))
    current
  )
)

;; Generate and advance verification counter
(define-private (next-attestation-id)
  (let ((current (var-get attestation-counter)))
    (var-set attestation-counter (+ current u1))
    current
  )
)

;; ============================================================================
;; READ-ONLY QUERIES
;; ============================================================================

;; Retrieves producer account information
(define-read-only (fetch-producer-profile (account principal))
  (map-get? producer-directory { principal: account })
)

;; Retrieves land plot details
(define-read-only (fetch-land-data (plot-id uint))
  (map-get? land-registry { plot-id: plot-id })
)

;; Retrieves crop cycle information
(define-read-only (fetch-cycle-data (cycle-id uint))
  (map-get? crop-cycles { cycle-id: cycle-id })
)

;; Retrieves production output record
(define-read-only (fetch-production-data (production-id uint))
  (map-get? production-records { production-id: production-id })
)

;; Retrieves certifier details
(define-read-only (fetch-certifier-profile (certifier principal))
  (map-get? certifier-registry { certifier: certifier })
)

;; Retrieves attestation details
(define-read-only (fetch-attestation-data (attestation-id uint))
  (map-get? attestation-ledger { attestation-id: attestation-id })
)

;; Queries permission status for a record
(define-read-only (query-access-permission (record-class (string-ascii 20)) (record-id uint) (viewer principal))
  (map-get? permission-matrix { record-class: record-class, record-id: record-id, viewer: viewer })
)

;; ============================================================================
;; ACCOUNT MANAGEMENT
;; ============================================================================

;; Establish a producer account
(define-public (enroll-as-producer (full-name (string-ascii 100)) (region (string-ascii 100)))
  (let ((caller tx-sender))
    (if (has-producer-account caller)
      fail-already-registered
      (begin
        (map-set producer-directory
          { principal: caller }
          {
            full-name: full-name,
            region: region,
            joined-at: block-height,
            enabled: true
          }
        )
        (ok true)
      )
    )
  )
)

;; ============================================================================
;; LAND MANAGEMENT
;; ============================================================================

;; Register a new cultivatable plot
(define-public (register-plot 
    (coordinates (string-ascii 255)) 
    (area-hectares uint) 
    (terrain-composition (string-ascii 50)))
  (let ((caller tx-sender)
        (new-plot-id (next-plot-id)))
    (if (not (has-producer-account caller))
      fail-unauthorized
      (begin
        (map-set land-registry
          { plot-id: new-plot-id }
          {
            owner: caller,
            coordinates: coordinates,
            area-hectares: area-hectares,
            terrain-composition: terrain-composition,
            registered-at: block-height,
            enabled: true
          }
        )
        (ok new-plot-id)
      )
    )
  )
)

;; Modify plot information
(define-public (adjust-plot-properties 
    (plot-id uint) 
    (coordinates (string-ascii 255)) 
    (area-hectares uint) 
    (terrain-composition (string-ascii 50)) 
    (enabled bool))
  (let ((caller tx-sender))
    (if (not (owns-plot plot-id caller))
      fail-unauthorized
      (match (map-get? land-registry { plot-id: plot-id })
        plot-details (begin
          (map-set land-registry
            { plot-id: plot-id }
            {
              owner: caller,
              coordinates: coordinates,
              area-hectares: area-hectares,
              terrain-composition: terrain-composition,
              registered-at: (get registered-at plot-details),
              enabled: enabled
            }
          )
          (ok true)
        )
        fail-not-found
      )
    )
  )
)

;; ============================================================================
;; CULTIVATION TRACKING
;; ============================================================================

;; Record the start of a cultivation cycle
(define-public (initiate-crop-cycle 
    (plot-id uint) 
    (variety (string-ascii 100)) 
    (started-at uint) 
    (materials-applied (string-ascii 255)) 
    (notes (string-ascii 255)))
  (let ((caller tx-sender)
        (new-cycle-id (next-cycle-id)))
    (if (not (owns-plot plot-id caller))
      fail-unauthorized
      (match (map-get? land-registry { plot-id: plot-id })
        plot-details (begin
          (map-set crop-cycles
            { cycle-id: new-cycle-id }
            {
              plot-id: plot-id,
              owner: caller,
              variety: variety,
              started-at: started-at,
              materials-applied: materials-applied,
              notes: notes
            }
          )
          (ok new-cycle-id)
        )
        fail-field-invalid
      )
    )
  )
)

;; Document harvest results and yield
(define-public (record-production-output 
    (cycle-id uint) 
    (output-weight uint) 
    (grade-assessment (string-ascii 255)) 
    (completed-at uint) 
    (notes (string-ascii 255)))
  (let ((caller tx-sender)
        (new-production-id (next-production-id)))
    (match (map-get? crop-cycles { cycle-id: cycle-id })
      cycle-data 
        (if (not (is-eq (get owner cycle-data) caller))
          fail-unauthorized
          (begin
            (map-set production-records
              { production-id: new-production-id }
              {
                cycle-id: cycle-id,
                plot-id: (get plot-id cycle-data),
                owner: caller,
                output-weight: output-weight,
                grade-assessment: grade-assessment,
                completed-at: completed-at,
                notes: notes
              }
            )
            (ok new-production-id)
          )
        )
      fail-planting-invalid
    )
  )
)

;; ============================================================================
;; VERIFICATION & CERTIFICATION
;; ============================================================================

;; Register as a third-party certifier
(define-public (register-as-certifier (organization (string-ascii 100)) (specialization (string-ascii 100)))
  (let ((caller tx-sender))
    (if (is-certifier caller)
      fail-already-registered
      (begin
        (map-set certifier-registry
          { certifier: caller }
          {
            organization: organization,
            specialization: specialization,
            registered-at: block-height,
            enabled: true
          }
        )
        (ok true)
      )
    )
  )
)

;; Submit a certification or verification attestation
(define-public (lodge-attestation 
    (subject-class (string-ascii 20)) 
    (subject-id uint) 
    (outcome (string-ascii 20)) 
    (remarks (string-ascii 255)))
  (let ((caller tx-sender)
        (new-attestation-id (next-attestation-id)))
    (if (not (is-certifier caller))
      fail-verifier-not-registered
      (begin
        (map-set attestation-ledger
          { attestation-id: new-attestation-id }
          {
            certifier: caller,
            subject-class: subject-class,
            subject-id: subject-id,
            certified-at: block-height,
            outcome: outcome,
            remarks: remarks
          }
        )
        (ok new-attestation-id)
      )
    )
  )
)

;; ============================================================================
;; ACCESS CONTROL & PERMISSIONS
;; ============================================================================

;; Authorize another party to view specific records
(define-public (authorize-viewer 
    (record-class (string-ascii 20)) 
    (record-id uint) 
    (viewer principal) 
    (tier (string-ascii 20)))
  (let ((caller tx-sender))
    ;; Validate permission for plot data
    (if (is-eq record-class "plot")
      (if (owns-plot record-id caller)
        (begin
          (map-set permission-matrix
            { record-class: record-class, record-id: record-id, viewer: viewer }
            { approved-by: caller, granted-when: block-height, tier: tier }
          )
          (ok true)
        )
        fail-unauthorized
      )
      ;; Validate permission for cycle data
      (if (is-eq record-class "cycle")
        (let ((cycle-info (map-get? crop-cycles { cycle-id: record-id })))
          (if (is-some cycle-info)
            (let ((ci (unwrap-panic cycle-info)))
              (if (is-eq (get owner ci) caller)
                (begin
                  (map-set permission-matrix
                    { record-class: record-class, record-id: record-id, viewer: viewer }
                    { approved-by: caller, granted-when: block-height, tier: tier }
                  )
                  (ok true)
                )
                fail-unauthorized
              )
            )
            fail-not-found
          )
        )
        ;; Validate permission for production data
        (if (is-eq record-class "production")
          (let ((prod-info (map-get? production-records { production-id: record-id })))
            (if (is-some prod-info)
              (let ((pi (unwrap-panic prod-info)))
                (if (is-eq (get owner pi) caller)
                  (begin
                    (map-set permission-matrix
                      { record-class: record-class, record-id: record-id, viewer: viewer }
                      { approved-by: caller, granted-when: block-height, tier: tier }
                    )
                    (ok true)
                  )
                  fail-unauthorized
                )
              )
              fail-not-found
            )
          )
          ;; Unrecognized record class
          fail-invalid-params
        )
      )
    )
  )
)

;; Remove view permissions for a principal
(define-public (withdraw-viewer-access (record-class (string-ascii 20)) (record-id uint) (viewer principal))
  (let ((caller tx-sender))
    (match (map-get? permission-matrix { record-class: record-class, record-id: record-id, viewer: viewer })
      existing-permission
        (if (is-eq (get approved-by existing-permission) caller)
          (begin
            (map-delete permission-matrix { record-class: record-class, record-id: record-id, viewer: viewer })
            (ok true)
          )
          fail-unauthorized
        )
      fail-not-found
    )
  )
)
