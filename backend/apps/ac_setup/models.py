# apps/ac_setup/models.py
from django.db import models

class ACSetup(models.Model):
    cih_code = models.IntegerField(blank=True, null=True)
    freight_code = models.IntegerField(blank=True, null=True)
    t_o_code = models.IntegerField(blank=True, null=True)
    purchase_code = models.IntegerField(blank=True, null=True)
    sale_code = models.IntegerField(blank=True, null=True)
    sale_code_mix = models.IntegerField(blank=True, null=True)
    cashsale_code = models.IntegerField(blank=True, null=True)
    sample_code = models.IntegerField(blank=True, null=True)
    cashdisc_code = models.IntegerField(blank=True, null=True)
    debtor_code = models.IntegerField(blank=True, null=True)
    creditor_code = models.IntegerField(blank=True, null=True)
    lgr_date_from = models.DateField(blank=True, null=True)
    lgr_date_to = models.DateField(blank=True, null=True)

    class Meta:
        db_table = 'AC_SETUP'
        managed = False

    def __str__(self):
        return f"AC Setup (purchase_code={self.purchase_code})"