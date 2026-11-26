# ==============================================================================
# LockExam Windows Native Backend Server & Database Engine
# Menjalankan server aplikasi dan Supabase Mock API langsung di PowerShell
# Tanpa memerlukan instalasi Node.js, Python, atau dependensi eksternal!
# ==============================================================================

param(
    [int]$Port = 3000
)

$baseDir = $PSScriptRoot
$dataFile = Join-Path $baseDir "data\database.json"
$dataDir = Join-Path $baseDir "data"

if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}

function Get-Database {
    if (Test-Path $dataFile) {
        $raw = [System.IO.File]::ReadAllText($dataFile, [System.Text.Encoding]::UTF8)
        return ($raw | ConvertFrom-Json)
    }
    return [PSCustomObject]@{
        schools = @()
        proctors = @()
        students = @()
        activeToken = "LKX892"
        results = @()
        ujian = @()
        sesi_ujian = @()
    }
}

function Save-Database($db) {
    $json = $db | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText($dataFile, $json, [System.Text.Encoding]::UTF8)
}

function Read-RequestBody($request) {
    if ($request.HasEntityBody) {
        $encoding = [System.Text.Encoding]::UTF8
        if ($request.ContentEncoding) { $encoding = $request.ContentEncoding }
        $reader = New-Object System.IO.StreamReader($request.InputStream, $encoding)
        return $reader.ReadToEnd()
    }
    return ""
}

function Send-Json($response, $data, [int]$status = 200) {
    $response.StatusCode = $status
    $response.ContentType = "application/json; charset=utf-8"
    $response.AddHeader("Content-Range", "0-100/100")
    $json = ""
    if ($data -is [string]) {
        $json = $data
    } else {
        $json = ($data | ConvertTo-Json -Depth 10 -Compress)
    }
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $response.ContentLength64 = $bytes.Length
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
    $response.Close()
}

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
} catch {
    Write-Host "[ERROR] Gagal menjalankan server di port $Port. Port mungkin sedang aktif." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "           LOCKEXAM CBT SERVER & DATABASE BERJALAN              " -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " URL Aplikasi   : http://localhost:$Port/" -ForegroundColor Green
Write-Host " Letak Database : $dataFile" -ForegroundColor White
Write-Host " Mode Backend   : Native Windows HTTP + Supabase RPC Engine" -ForegroundColor Cyan
Write-Host " Tekan Ctrl+C di jendela ini untuk mematikan server." -ForegroundColor Gray
Write-Host "-----------------------------------------------------------------" -ForegroundColor Cyan

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
}

# Variable tracking login session role
$global:lastLoginRole = "admin"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # CORS & Cache Headers
        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE, PATCH")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey, x-client-info, Prefer, Range")
        $response.AddHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length")
        $response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate")
        $response.AddHeader("Pragma", "no-cache")
        $response.AddHeader("Expires", "0")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 204
            $response.Close()
            continue
        }

        $rawUrl = $request.Url.LocalPath
        $query = $request.Url.Query
        $timeStr = (Get-Date).ToString("HH:mm:ss")
        Write-Host "[$timeStr] $($request.HttpMethod) $rawUrl$query" -ForegroundColor Gray

        # ==================== 1. SUPABASE AUTH API (/auth/v1/*) ====================
        if ($rawUrl.StartsWith("/auth/v1/")) {
            $authAction = $rawUrl.Replace("/auth/v1/", "").Split("?")[0].Trim("/")
            $bodyStr = Read-RequestBody $request
            $bodyJson = $null
            if (-not [string]::IsNullOrEmpty($bodyStr)) {
                try { $bodyJson = ($bodyStr | ConvertFrom-Json) } catch {}
            }

            if ($authAction -eq "token") {
                # Login dengan password
                $email = ""
                if ($bodyJson -and $bodyJson.email) { $email = $bodyJson.email.ToString() }
                $isStudent = ($email.Contains(".lockexam.local") -or $email -eq "siswa" -or ($email -match "^\d+$"))
                
                $role = "admin"
                $userName = "Administrator CBT"
                $userId = "usr_admin_123"

                if ($isStudent) {
                    $role = "siswa"
                    $userName = "Ahmad Fauzi (Siswa)"
                    $userId = "usr_siswa_123"
                    $global:lastLoginRole = "siswa"
                } else {
                    $global:lastLoginRole = "admin"
                }

                $authResponse = [PSCustomObject]@{
                    access_token = "mock-lockexam-jwt-token-session"
                    token_type = "bearer"
                    expires_in = 360000
                    refresh_token = "mock-refresh-token"
                    user = [PSCustomObject]@{
                        id = $userId
                        aud = "authenticated"
                        role = "authenticated"
                        email = if ($email) { $email } else { "admin@lockexam.id" }
                        email_confirmed_at = "2026-01-01T00:00:00.000Z"
                        user_metadata = [PSCustomObject]@{
                            nama = $userName
                            role = $role
                        }
                        app_metadata = [PSCustomObject]@{
                            provider = "email"
                        }
                    }
                }
                Write-Host "  -> [AUTH SUCCESS] Login sebagai $role ($email)" -ForegroundColor Green
                Send-Json $response $authResponse 200
                continue
            }
            elseif ($authAction -eq "signup") {
                # Pendaftaran user/sekolah baru
                $email = if ($bodyJson -and $bodyJson.email) { $bodyJson.email } else { "user@sekolah.sch.id" }
                $signupRes = [PSCustomObject]@{
                    id = "usr_" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                    aud = "authenticated"
                    role = "authenticated"
                    email = $email
                    confirmation_sent_at = (Get-Date).ToString("o")
                }
                Write-Host "  -> [AUTH SIGNUP] User terdaftar: $email" -ForegroundColor Green
                Send-Json $response [PSCustomObject]@{ user = $signupRes } 200
                continue
            }
            elseif ($authAction -eq "recover") {
                Send-Json $response [PSCustomObject]@{ message = "Tautan pemulihan kata sandi telah dikirim." } 200
                continue
            }
            elseif ($authAction -eq "logout" -or $authAction -eq "signout") {
                Send-Json $response [PSCustomObject]@{ success = $true } 200
                continue
            }
            elseif ($authAction -eq "user") {
                $role = $global:lastLoginRole
                $userObj = [PSCustomObject]@{
                    id = if ($role -eq "siswa") { "usr_siswa_123" } else { "usr_admin_123" }
                    aud = "authenticated"
                    role = "authenticated"
                    email = if ($role -eq "siswa") { "1234567890@20101234.lockexam.local" } else { "admin@lockexam.id" }
                    user_metadata = [PSCustomObject]@{
                        nama = if ($role -eq "siswa") { "Ahmad Fauzi" } else { "Administrator CBT" }
                        role = $role
                    }
                }
                Send-Json $response $userObj 200
                continue
            }
            else {
                Send-Json $response [PSCustomObject]@{ success = $true } 200
                continue
            }
        }

        # ==================== 2. SUPABASE RPC API (/rest/v1/rpc/*) ====================
        if ($rawUrl.StartsWith("/rest/v1/rpc/")) {
            $rpcName = $rawUrl.Replace("/rest/v1/rpc/", "").Trim("/")
            $bodyStr = Read-RequestBody $request
            $bodyJson = $null
            if (-not [string]::IsNullOrEmpty($bodyStr)) {
                try { $bodyJson = ($bodyStr | ConvertFrom-Json) } catch {}
            }
            $db = Get-Database

            # 2.1 cari_sekolah
            if ($rpcName -eq "cari_sekolah") {
                $q = ""
                if ($bodyJson -and $bodyJson.p_q) { $q = $bodyJson.p_q.ToString().ToLower() }
                
                $matched = @()
                foreach ($s in $db.schools) {
                    $sName = if ($s.nama) { $s.nama.ToString().ToLower() } elseif ($s.name) { $s.name.ToString().ToLower() } else { "" }
                    $sNpsn = if ($s.npsn) { $s.npsn.ToString().ToLower() } else { "" }
                    if ([string]::IsNullOrEmpty($q) -or $sName.Contains($q) -or $sNpsn.Contains($q)) {
                        $matched += [PSCustomObject]@{
                            id = $s.id
                            nama = if ($s.nama) { $s.nama } else { $s.name }
                            npsn = $s.npsn
                            bentuk = if ($s.bentuk) { $s.bentuk } else { "SMA" }
                            status = if ($s.status) { $s.status } else { "Negeri" }
                            alamat = if ($s.alamat) { $s.alamat } else { "Jl. Pendidikan No. 1" }
                            desa_kelurahan = if ($s.desa_kelurahan) { $s.desa_kelurahan } else { "Pusat" }
                            kecamatan = if ($s.kecamatan) { $s.kecamatan } else { "Kecamatan Kota" }
                            kabupaten_kota = if ($s.kabupaten_kota) { $s.kabupaten_kota } else { "Kota Jakarta Pusat" }
                            provinsi = if ($s.provinsi) { $s.provinsi } else { "DKI Jakarta" }
                        }
                    }
                }
                Write-Host "  -> [RPC cari_sekolah] Ditemukan $($matched.Count) sekolah untuk query '$q'" -ForegroundColor Green
                Send-Json $response $matched 200
                continue
            }

            # 2.2 daftar_wilayah
            elseif ($rpcName -eq "daftar_wilayah") {
                $tingkat = "provinsi"
                if ($bodyJson -and $bodyJson.p_tingkat) { $tingkat = $bodyJson.p_tingkat }
                
                if ($tingkat -eq "provinsi") {
                    $wilayah = @(
                        [PSCustomObject]@{ kode = "31"; nama = "DKI Jakarta" },
                        [PSCustomObject]@{ kode = "32"; nama = "Jawa Barat" },
                        [PSCustomObject]@{ kode = "33"; nama = "Jawa Tengah" },
                        [PSCustomObject]@{ kode = "35"; nama = "Jawa Timur" },
                        [PSCustomObject]@{ kode = "51"; nama = "Bali" },
                        [PSCustomObject]@{ kode = "36"; nama = "Banten" },
                        [PSCustomObject]@{ kode = "12"; nama = "Sumatera Utara" }
                    )
                } else {
                    $wilayah = @(
                        [PSCustomObject]@{ kode = "3171"; nama = "Kota Jakarta Pusat" },
                        [PSCustomObject]@{ kode = "3172"; nama = "Kota Jakarta Utara" },
                        [PSCustomObject]@{ kode = "3173"; nama = "Kota Jakarta Barat" },
                        [PSCustomObject]@{ kode = "3174"; nama = "Kota Jakarta Selatan" },
                        [PSCustomObject]@{ kode = "3175"; nama = "Kota Jakarta Timur" }
                    )
                }
                Send-Json $response $wilayah 200
                continue
            }

            # 2.3 status_percobaan
            elseif ($rpcName -eq "status_percobaan") {
                $statusObj = [PSCustomObject]@{
                    status_akun = "aktif"
                    nama = "SMAN 1 Teladan Jakarta"
                    jenjang = "SMA"
                    npsn = "10293847"
                    sisa_detik = 604800
                    hari = 7
                    kelas = 5
                    siswa = 120
                    max_kelas = 50
                    max_siswa = 1000
                }
                Send-Json $response $statusObj 200
                continue
            }

            # 2.4 dashboard_ringkas
            elseif ($rpcName -eq "dashboard_ringkas") {
                $dashObj = [PSCustomObject]@{
                    status_peserta = [PSCustomObject]@{
                        total = 45
                        selesai = 40
                        sedang_mengerjakan = 5
                        belum_mulai = 0
                    }
                    total_ujian = 2
                    peserta_total = 45
                    rata_nilai = 84.5
                    status_ujian = "aktif"
                    jadwal = @(
                        [PSCustomObject]@{
                            id = "uj_1"
                            judul = "Penilaian Akhir Semester - Matematika Wajib"
                            mapel = "Matematika"
                            mulai = "2026-11-26 07:30"
                            selesai = "2026-11-26 12:00"
                            status = "Sedang Berlangsung"
                        },
                        [PSCustomObject]@{
                            id = "uj_2"
                            judul = "Simulasi CBT - Bahasa Indonesia"
                            mapel = "Bahasa Indonesia"
                            mulai = "2026-11-26 08:00"
                            selesai = "2026-11-26 15:00"
                            status = "Siap Dikerjakan"
                        }
                    )
                }
                Send-Json $response $dashObj 200
                continue
            }

            # 2.5 daftar_paket
            elseif ($rpcName -eq "daftar_paket") {
                $paketList = @(
                    [PSCustomObject]@{
                        id = "pkt_1"
                        nama = "Paket Soal Matematika Wajib Kelas XII"
                        mapel = "Matematika"
                        jenjang = "SMA"
                        tingkat = "12"
                        total_soal = 25
                        dibuat = (Get-Date).ToString("yyyy-MM-dd")
                    },
                    [PSCustomObject]@{
                        id = "pkt_2"
                        nama = "Paket Soal Bahasa Indonesia Kelas XII"
                        mapel = "Bahasa Indonesia"
                        jenjang = "SMA"
                        tingkat = "12"
                        total_soal = 30
                        dibuat = (Get-Date).ToString("yyyy-MM-dd")
                    }
                )
                Send-Json $response $paketList 200
                continue
            }

            # 2.6 hasil_ujian
            elseif ($rpcName -eq "hasil_ujian") {
                $hasilObj = [PSCustomObject]@{
                    nilai = 88.0
                    judul = "Simulasi CBT - Bahasa Indonesia"
                    mapel = "Bahasa Indonesia"
                    tampil = $true
                    benar = 22
                    salah = 3
                    total = 25
                }
                Send-Json $response $hasilObj 200
                continue
            }

            # 2.7 my_sekolah
            elseif ($rpcName -eq "my_sekolah") {
                $sch = [PSCustomObject]@{
                    id = "sch_1"
                    nama = "SMAN 1 Teladan Jakarta"
                    npsn = "10293847"
                    jenjang = "SMA"
                    alamat = "Jl. Budi Utomo No. 7, Jakarta Pusat"
                }
                Send-Json $response $sch 200
                continue
            }

            # 2.8 Default fallback untuk RPC lainnya
            else {
                Write-Host "  -> [RPC Fallback] $rpcName terpanggil" -ForegroundColor DarkYellow
                Send-Json $response [PSCustomObject]@{ success = $true } 200
                continue
            }
        }

        # ==================== 3. SUPABASE TABLES API (/rest/v1/*) ====================
        if ($rawUrl.StartsWith("/rest/v1/")) {
            $tableName = $rawUrl.Replace("/rest/v1/", "").Split("?")[0].Trim("/")
            $db = Get-Database

            # 3.1 profiles
            if ($tableName -eq "profiles") {
                $role = $global:lastLoginRole
                if ($role -eq "siswa") {
                    $profileData = @(
                        [PSCustomObject]@{
                            id = "usr_siswa_123"
                            nama = "Ahmad Fauzi"
                            nisn = "1234567890"
                            role = "siswa"
                            sekolah_id = "sch_1"
                            kelas = "XII MIPA 1"
                            email = "1234567890@20101234.lockexam.local"
                        }
                    )
                } else {
                    $profileData = @(
                        [PSCustomObject]@{
                            id = "usr_admin_123"
                            nama = "Administrator CBT"
                            role = "admin"
                            sekolah_id = "sch_1"
                            email = "admin@lockexam.id"
                        }
                    )
                }
                Send-Json $response $profileData 200
                continue
            }

            # 3.2 settings
            elseif ($tableName -eq "settings") {
                $settingsData = @(
                    [PSCustomObject]@{
                        key = "sekolah"
                        value = [PSCustomObject]@{
                            nama = "SMAN 1 Teladan Jakarta"
                            npsn = "10293847"
                            jenjang = "SMA"
                            alamat = "Jl. Budi Utomo No. 7, Jakarta Pusat"
                        }
                    }
                )
                Send-Json $response $settingsData 200
                continue
            }

            # 3.3 ujian
            elseif ($tableName -eq "ujian") {
                $ujianList = @($db.ujian)
                Send-Json $response $ujianList 200
                continue
            }

            # 3.4 sesi_ujian
            elseif ($tableName -eq "sesi_ujian") {
                $sesiList = @($db.sesi_ujian)
                Send-Json $response $sesiList 200
                continue
            }

            # 3.5 soal / paket_soal / pelanggaran / ujian_kelas
            elseif ($tableName -eq "paket_soal" -or $tableName -eq "soal" -or $tableName -eq "pelanggaran" -or $tableName -eq "ujian_kelas") {
                Send-Json $response @() 200
                continue
            }

            # 3.6 Default Table Fallback
            else {
                Send-Json $response @() 200
                continue
            }
        }

        # ==================== 4. CUSTOM / LEGACY REST API (/api/*) ====================
        if ($rawUrl.StartsWith("/api/")) {
            $db = Get-Database

            if ($rawUrl -eq "/api/schools") {
                if ($request.HttpMethod -eq "GET") {
                    Send-Json $response $db.schools 200
                }
                elseif ($request.HttpMethod -eq "POST") {
                    $bodyStr = Read-RequestBody $request
                    $newSchool = $bodyStr | ConvertFrom-Json
                    if (-not $newSchool.id) {
                        $newSchool | Add-Member -MemberType NoteProperty -Name "id" -Value ("sch_" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())
                    }
                    if (-not $newSchool.createdAt) {
                        $newSchool | Add-Member -MemberType NoteProperty -Name "createdAt" -Value ((Get-Date).ToString("o"))
                    }
                    $list = [System.Collections.ArrayList]@($db.schools)
                    [void]$list.Add($newSchool)
                    $db.schools = $list
                    Save-Database $db

                    Write-Host "  -> [DB UPDATE] Sekolah baru didaftarkan: $($newSchool.name)" -ForegroundColor Green
                    $resObj = @{ success = $true; "data" = $newSchool }
                    Send-Json $response $resObj 201
                }
                continue
            }
            elseif ($rawUrl -eq "/api/students") {
                if ($request.HttpMethod -eq "GET") {
                    Send-Json $response $db.students 200
                }
                elseif ($request.HttpMethod -eq "POST") {
                    $bodyStr = Read-RequestBody $request
                    $newStudent = $bodyStr | ConvertFrom-Json
                    $list = [System.Collections.ArrayList]@($db.students)
                    [void]$list.Add($newStudent)
                    $db.students = $list
                    Save-Database $db
                    Send-Json $response [PSCustomObject]@{ success = $true; message = "Data siswa tersimpan" } 201
                }
                continue
            }
            elseif ($rawUrl -eq "/api/token") {
                if ($request.HttpMethod -eq "GET") {
                    Send-Json $response [PSCustomObject]@{ token = $db.activeToken } 200
                }
                elseif ($request.HttpMethod -eq "POST") {
                    $bodyStr = Read-RequestBody $request
                    $payload = $bodyStr | ConvertFrom-Json
                    $db.activeToken = $payload.token
                    Save-Database $db
                    Write-Host "  -> [DB UPDATE] Token ujian: $($payload.token)" -ForegroundColor Yellow
                    Send-Json $response [PSCustomObject]@{ success = $true; token = $db.activeToken } 200
                }
                continue
            }
            elseif ($rawUrl -eq "/api/results") {
                if ($request.HttpMethod -eq "GET") {
                    Send-Json $response $db.results 200
                }
                elseif ($request.HttpMethod -eq "POST") {
                    $bodyStr = Read-RequestBody $request
                    $newResult = $bodyStr | ConvertFrom-Json
                    $list = [System.Collections.ArrayList]@($db.results)
                    [void]$list.Add($newResult)
                    $db.results = $list
                    Save-Database $db
                    Send-Json $response [PSCustomObject]@{ success = $true; message = "Nilai berhasil disimpan" } 201
                }
                continue
            }
            else {
                Send-Json $response [PSCustomObject]@{ error = "API endpoint tidak ditemukan" } 404
                continue
            }
        }

        # ==================== 5. STATIC FILES & SPA FALLBACK ====================
        $cleanPath = $rawUrl.TrimStart("/")
        if ([string]::IsNullOrEmpty($cleanPath) -or $cleanPath -eq "/") {
            $cleanPath = "index.html"
        }

        $fullPath = Join-Path $baseDir $cleanPath

        if (Test-Path $fullPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            $mime = "application/octet-stream"
            if ($mimeTypes.ContainsKey($ext)) {
                $mime = $mimeTypes[$ext]
            }

            $response.ContentType = $mime
            $response.StatusCode = 200
            $fileBytes = [System.IO.File]::ReadAllBytes($fullPath)
            $response.ContentLength64 = $fileBytes.Length
            $response.OutputStream.Write($fileBytes, 0, $fileBytes.Length)
            $response.Close()
        }
        else {
            # SPA Fallback: jika path tidak memiliki ekstensi file (misal /daftar-sekolah, /admin, dll)
            # sajikan index.html agar router React menangani perutean halaman secara sempurna!
            $hasExtension = [System.IO.Path]::HasExtension($cleanPath)
            if (-not $hasExtension) {
                $indexPath = Join-Path $baseDir "index.html"
                if (Test-Path $indexPath -PathType Leaf) {
                    $response.ContentType = "text/html; charset=utf-8"
                    $response.StatusCode = 200
                    $fileBytes = [System.IO.File]::ReadAllBytes($indexPath)
                    $response.ContentLength64 = $fileBytes.Length
                    $response.OutputStream.Write($fileBytes, 0, $fileBytes.Length)
                    $response.Close()
                    continue
                }
            }

            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 File Not Found</h1><p>$rawUrl tidak ditemukan.</p>")
            $response.ContentType = "text/html; charset=utf-8"
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            $response.Close()
        }
    }
    catch {
        # Tangani error tak terduga atau koneksi terputus dari browser
    }
}
